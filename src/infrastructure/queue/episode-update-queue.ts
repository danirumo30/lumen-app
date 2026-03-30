

import { toggleEpisodesBatch } from "@/infrastructure/persistence/supabase/media/episode-queries";
import type { EpisodeToggle } from '@/application/media/dto/episode.dto';


interface QueuedOperation {
  id: string;
  tmdbId: number;
  season: number;
  episode: number;
  watched: boolean;
  runtime?: number;
  timestamp: number;
}


export interface EpisodeSyncError {
  tmdbId: number;
  error: Error;
  operations: QueuedOperation[];
}


interface EpisodeUpdateQueueConfig {
  
  debounceMs: number;
  
  batchSize: number;
  
  maxRetries: number;
  
  retryBaseDelayMs: number;
}

const DEFAULT_CONFIG: EpisodeUpdateQueueConfig = {
  debounceMs: 300,
  batchSize: 50,
  maxRetries: 3,
  retryBaseDelayMs: 1000,
};


class EpisodeUpdateQueue {
  private queue: Map<number, QueuedOperation[]> = new Map();
  private debounceTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();
  private pendingFlushes: Map<number, Promise<void>> = new Map();
  private config: EpisodeUpdateQueueConfig;
  private eventTarget: EventTarget;

  constructor(config: Partial<EpisodeUpdateQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.eventTarget = typeof window !== "undefined" ? new EventTarget() : new EventTarget();
  }

  
  enqueue(operation: Omit<QueuedOperation, "id" | "timestamp">): void {
    const { tmdbId, season, episode } = operation;
    const timestamp = Date.now();
    const id = `${tmdbId}-${season}-${episode}-${timestamp}`;

    const operations = this.queue.get(tmdbId) || [];

    const existingIndex = operations.findIndex(
      (op) => op.season === season && op.episode === episode
    );

    if (existingIndex >= 0) {
      
      operations[existingIndex] = { ...operation, id, timestamp };
    } else {
      operations.push({ ...operation, id, timestamp });
    }

    this.queue.set(tmdbId, operations);

    this.resetDebounceTimer(tmdbId);
  }

  
  dequeue(tmdbId: number, season: number, episode: number): void {
    const operations = this.queue.get(tmdbId);
    if (!operations) return;

    const filtered = operations.filter(
      (op) => !(op.season === season && op.episode === episode)
    );

    if (filtered.length === 0) {
      this.queue.delete(tmdbId);
      this.clearDebounceTimer(tmdbId);
    } else {
      this.queue.set(tmdbId, filtered);
    }
  }

  
  getQueuedOperations(tmdbId: number): QueuedOperation[] {
    return this.queue.get(tmdbId) || [];
  }

  
  getQueuedCount(tmdbId: number): number {
    return this.queue.get(tmdbId)?.length || 0;
  }

  
  hasPending(tmdbId: number): boolean {
    return this.pendingFlushes.has(tmdbId);
  }

  
  async flushAll(): Promise<void> {
    const tmdbIds = Array.from(this.queue.keys());
    await Promise.all(tmdbIds.map((tmdbId) => this.flush(tmdbId)));
  }

  
  async flush(tmdbId: number): Promise<void> {
    const operations = this.queue.get(tmdbId);
    if (!operations || operations.length === 0) return;

    const existingFlush = this.pendingFlushes.get(tmdbId);
    if (existingFlush) {
      return existingFlush;
    }

    this.queue.set(tmdbId, []);
    this.clearDebounceTimer(tmdbId);

    
    const sorted = [...operations].sort((a, b) => a.timestamp - b.timestamp);

    const episodes: EpisodeToggle[] = sorted.map((op) => ({
      seasonNumber: op.season,
      episodeNumber: op.episode,
      watched: op.watched,
      runtime: op.runtime,
    }));

    const flushPromise = this.persistWithRetry(tmdbId, episodes, sorted);
    this.pendingFlushes.set(tmdbId, flushPromise);

    try {
      await flushPromise;
    } finally {
      this.pendingFlushes.delete(tmdbId);
    }
  }

  
  addErrorListener(callback: (event: CustomEvent<EpisodeSyncError>) => void): () => void {
    const handler = (event: Event) => callback(event as CustomEvent<EpisodeSyncError>);
    this.eventTarget.addEventListener("episode-sync-error", handler);
    return () => this.eventTarget.removeEventListener("episode-sync-error", handler);
  }

  
  clear(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.queue.clear();
    this.pendingFlushes.clear();
  }


  private resetDebounceTimer(tmdbId: number): void {
    this.clearDebounceTimer(tmdbId);

    const timer = setTimeout(() => {
      this.flush(tmdbId);
    }, this.config.debounceMs);

    this.debounceTimers.set(tmdbId, timer);
  }

  private clearDebounceTimer(tmdbId: number): void {
    const existingTimer = this.debounceTimers.get(tmdbId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(tmdbId);
    }
  }

  private async persistWithRetry(
    tmdbId: number,
    episodes: EpisodeToggle[],
    operations: QueuedOperation[]
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        if (episodes.length > this.config.batchSize) {
          await this.persistChunked(tmdbId, episodes);
        } else {
          await toggleEpisodesBatch(tmdbId, episodes);
        }
        return; 
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[EpisodeUpdateQueue] Retry ${attempt + 1}/${this.config.maxRetries} failed:`,
          lastError
        );

        
        if (this.isNonRetryableError(error)) {
          break;
        }

        
        const delay =
          this.config.retryBaseDelayMs * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    console.error("[EpisodeUpdateQueue] All retries exhausted:", lastError);
    this.emitError({
      tmdbId,
      error: lastError || new Error("Unknown error during batch persist"),
      operations,
    });
  }

  private async persistChunked(
    tmdbId: number,
    episodes: EpisodeToggle[]
  ): Promise<void> {
    const chunks: EpisodeToggle[][] = [];

    for (let i = 0; i < episodes.length; i += this.config.batchSize) {
      chunks.push(episodes.slice(i, i + this.config.batchSize));
    }

    for (const chunk of chunks) {
      await toggleEpisodesBatch(tmdbId, chunk);
    }
  }

  private isNonRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized") ||
        error.message.includes("Validation")
      ) {
        return true;
      }
    }
    return false;
  }

  private emitError(syncError: EpisodeSyncError): void {
    const event = new CustomEvent("episode-sync-error", {
      detail: syncError,
    });
    this.eventTarget.dispatchEvent(event);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const episodeUpdateQueue = new EpisodeUpdateQueue();








