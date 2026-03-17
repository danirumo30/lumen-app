import type { UserMediaRepository } from '@/modules/media/domain/user-media.repository';
import type { MediaId, MediaType, UserMediaState } from '@/modules/shared/domain/media';

export class SaveMediaStateUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(state: UserMediaState): Promise<void> {
    await this.mediaRepository.save(state);
  }
}

export class GetMediaStateUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaId: MediaId): Promise<UserMediaState | null> {
    return this.mediaRepository.findByUserAndMedia(userId, mediaId);
  }
}

export class GetUserMediaUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaType?: MediaType): Promise<UserMediaState[]> {
    return this.mediaRepository.getUserMedia(userId, mediaType);
  }
}

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

export class GetUserStatsUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string) {
    return this.mediaRepository.getUserStats(userId);
  }
}
