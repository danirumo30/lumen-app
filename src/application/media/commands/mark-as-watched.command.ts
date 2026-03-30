import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';
import type { MediaId, MediaType, UserMediaState } from '@/domain/shared/value-objects/media-id';

export class MarkAsWatchedUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaId: MediaId, mediaType: MediaType): Promise<void> {
    const existing = await this.mediaRepository.findByUserAndMedia(userId, mediaId);
    
    const newState: UserMediaState = {
      userId,
      mediaId,
      mediaType,
      isFavorite: existing?.isFavorite || false,
      isWatched: true,
      isPlanned: existing?.isPlanned || false,
    };

    await this.mediaRepository.save(newState);
  }
}




