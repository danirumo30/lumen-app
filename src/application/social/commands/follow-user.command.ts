import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';

export class FollowUserUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    await this.profileRepository.followUser(followerId, followingId);
  }
}




