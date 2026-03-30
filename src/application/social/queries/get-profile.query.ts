import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';
import type { UserProfileWithStats } from '@/domain/social/entities/user-profile.entity';

export class GetUserProfileUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(userId: string): Promise<UserProfileWithStats | null> {
    return this.profileRepository.getProfileById(userId);
  }

  async executeByUsername(username: string): Promise<UserProfileWithStats | null> {
    return this.profileRepository.getProfileByUsername(username);
  }
}




