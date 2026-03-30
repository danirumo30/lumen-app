import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';
import type { MediaId, MediaType, UserMediaState } from '@/domain/shared/value-objects/media-id';

export class ToggleFavoriteUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaId: MediaId, mediaType: MediaType): Promise<void> {
    const existing = await this.mediaRepository.findByUserAndMedia(userId, mediaId);
    
    const newState: UserMediaState = {
      userId,
      mediaId,
      mediaType: existing?.mediaType || mediaType,
      isFavorite: !existing?.isFavorite,
      isWatched: existing?.isWatched || false,
      isPlanned: existing?.isPlanned || false,
    };

    await this.mediaRepository.save(newState);
  }
}




