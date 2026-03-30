import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';

export class UnfollowUserUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(followerId: string, followingId: string): Promise<void> {
    await this.profileRepository.unfollowUser(followerId, followingId);
  }
}




