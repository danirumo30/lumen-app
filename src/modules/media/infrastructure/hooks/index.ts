/**
 * Media Module - Infrastructure Hooks
 * 
 * Barrel export for all episode-related hooks
 */

export {
  useWatchedEpisodes,
  useWatchedEpisodeSet,
  useIsEpisodeWatched,
  useWatchedEpisodeCount,
  useUpdateWatchedEpisodesCache,
  episodeKeys,
} from "./use-watched-episodes";

export {
  useEpisodeToggle,
  useOptimisticEpisodeToggle,
  useInvalidateEpisodeQueries,
  type ToggleEpisodeVariables,
} from "./use-episode-toggle";

export {
  useBatchEpisodeToggle,
  useSeasonToggle,
  useMarkAllEpisodes,
  type BatchEpisode,
  type BatchToggleVariables,
} from "./use-batch-episode-toggle";

