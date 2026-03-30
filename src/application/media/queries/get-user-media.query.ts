import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';
import type { MediaType, UserMediaState } from '@/domain/shared/value-objects/media-id';

export class GetUserMediaUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string, mediaType?: MediaType): Promise<UserMediaState[]> {
    return this.mediaRepository.getUserMedia(userId, mediaType);
  }
}




