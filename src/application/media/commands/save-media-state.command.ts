import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';
import type { UserMediaState } from '@/domain/shared/value-objects/media-id';

export class SaveMediaStateUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(state: UserMediaState): Promise<void> {
    await this.mediaRepository.save(state);
  }
}




