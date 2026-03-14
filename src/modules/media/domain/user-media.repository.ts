import type { MediaId, UserMediaState } from "@/modules/shared/domain/media";

export interface UserMediaRepository {
  save(state: UserMediaState): Promise<void>;
  findByUserAndMedia(
    userId: string,
    mediaId: MediaId,
  ): Promise<UserMediaState | null>;
}

