import { WatchedEpisode } from "../value-objects/watched-episode.vo";

export function getEpisodeMediaId(tmdbId: number, season: number, episode: number): string {
  return new WatchedEpisode(tmdbId, season, episode).toMediaId();
}

export function parseEpisodeMediaId(mediaId: string): WatchedEpisode | null {
  return WatchedEpisode.fromMediaId(mediaId);
}

export function mediaIdSetToWatchedEpisodes(
  mediaIds: Set<string>,
  tmdbId: number
): WatchedEpisode[] {
  const watched: WatchedEpisode[] = [];

  for (const mediaId of mediaIds) {
    const parsed = parseEpisodeMediaId(mediaId);
    if (parsed && parsed.tmdbId === tmdbId) {
      watched.push(parsed);
    }
  }

  return watched;
}

export function watchedEpisodesToMediaIdSet(
  episodes: WatchedEpisode[]
): Set<string> {
  const set = new Set<string>();

  for (const ep of episodes) {
    set.add(ep.toMediaId());
  }

  return set;
}
