import type { UserMediaRepository } from '@/domain/media/repository/user-media.port';

export class GetUserStatsUseCase {
  constructor(private readonly mediaRepository: UserMediaRepository) {}

  async execute(userId: string) {
    return this.mediaRepository.getUserStats(userId);
  }
}




