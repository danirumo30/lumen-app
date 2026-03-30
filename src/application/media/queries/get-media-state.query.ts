import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';
import type { MediaId, UserMediaState } from '@/domain/shared/value-objects/media-id';

export class GetMediaStateUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaId: MediaId): Promise<UserMediaState | null> {
    return this.mediaRepository.findByUserAndMedia(userId, mediaId);
  }
}




