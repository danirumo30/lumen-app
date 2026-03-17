import type { UserProfileRepository } from '@/modules/social/domain/user-profile.repository';
import type { UpdateProfileData, UserProfileWithStats } from '@/modules/social/domain/user-profile';

export class GetUserProfileUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(userId: string): Promise<UserProfileWithStats | null> {
    return this.profileRepository.getProfileById(userId);
  }

  async executeByUsername(username: string): Promise<UserProfileWithStats | null> {
    return this.profileRepository.getProfileByUsername(username);
  }
}

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(userId: string, data: UpdateProfileData): Promise<void> {
    // Validate data before updating
    if (data.username !== undefined) {
      const isAvailable = await this.profileRepository.isUsernameAvailable(data.username, userId);
      if (!isAvailable) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    await this.profileRepository.updateProfile(userId, data);
  }
}

export class FollowUserUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    await this.profileRepository.followUser(followerId, followingId);
  }
}

export class UnfollowUserUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(followerId: string, followingId: string): Promise<void> {
    await this.profileRepository.unfollowUser(followerId, followingId);
  }
}

export class SearchUsersUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(query: string, limit: number = 20): Promise<ReturnType<typeof this.profileRepository.searchUsers>> {
    if (!query || query.length < 2) {
      return [];
    }
    return this.profileRepository.searchUsers(query, limit);
  }
}
