import type { MediaId, UserMediaState, MediaType } from "@/domain/shared/value-objects/media-id";

export interface UserMediaRepository {
  save(state: UserMediaState): Promise<void>;
  findByUserAndMedia(userId: string, mediaId: MediaId): Promise<UserMediaState | null>;
  getUserMedia(userId: string, mediaType?: MediaType): Promise<UserMediaState[]>;
  getUserStats(userId: string): Promise<{
    totalMovieMinutes: number;
    totalTvMinutes: number;
    totalGameMinutes: number;
    totalMinutes: number;
  }>;
}




