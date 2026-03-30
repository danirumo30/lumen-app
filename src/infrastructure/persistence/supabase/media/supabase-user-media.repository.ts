import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MediaType,
} from '@/domain/shared/value-objects/media-id';
import { MediaId } from '@/domain/shared/value-objects/media-id';
import { UserMediaState } from '@/domain/media/entities/user-media-state.entity';
import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';

interface UserMediaTrackingRow {
  user_id: string;
  media_id: string;
  media_type: string;
  is_favorite: boolean;
  is_watched: boolean;
  is_planned: boolean;
  rating: number | null;
  progress_minutes: number | null;
  has_platinum: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseUserMediaRepository implements UserMediaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(state: UserMediaState): Promise<void> {
    const row = this.toPersistence(state);

    const { error } = await this.client
      .from("user_media_tracking")
      .upsert(row, { onConflict: "user_id,media_id" });

    if (error) {
      throw error;
    }
  }

  async findByUserAndMedia(userId: string, mediaId: MediaId): Promise<UserMediaState | null> {
    const { data, error } = await this.client
      .from("user_media_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("media_id", mediaId.toString())
      .maybeSingle<UserMediaTrackingRow>();

    if (error) throw error;
    if (!data) return null;

    return this.toDomain(data);
  }

  async getUserMedia(userId: string, mediaType?: MediaType): Promise<UserMediaState[]> {
    let query = this.client
      .from("user_media_tracking")
      .select("*")
      .eq("user_id", userId);

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(row => this.toDomain(row));
  }

  async getUserStats(userId: string): Promise<{
    totalMovieMinutes: number;
    totalTvMinutes: number;
    totalGameMinutes: number;
    totalMinutes: number;
  }> {
    const { data, error } = await this.client
      .from("user_global_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return {
      totalMovieMinutes: data?.total_movie_minutes ?? 0,
      totalTvMinutes: data?.total_tv_minutes ?? 0,
      totalGameMinutes: data?.total_game_minutes ?? 0,
      totalMinutes: data?.total_minutes ?? 0,
    };
  }

  private toPersistence(state: UserMediaState): UserMediaTrackingRow {
    return {
      user_id: state.userId,
      media_id: state.mediaId.toString(),
      media_type: state.mediaType,
      is_favorite: state.isFavorite,
      is_watched: state.isWatched,
      is_planned: state.isPlanned,
      rating: state.rating ?? null,
      progress_minutes: state.progressMinutes ?? null,
      has_platinum: state.hasPlatinum,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private toDomain(row: UserMediaTrackingRow): UserMediaState {
    return new UserMediaState(
      row.user_id,
      MediaId.fromString(row.media_id),
      row.media_type as MediaType,
      row.is_favorite,
      row.is_watched,
      row.is_planned,
      row.rating ?? undefined,
      row.progress_minutes ?? undefined,
      row.has_platinum
    );
  }
}

