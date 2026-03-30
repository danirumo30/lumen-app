import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';
import type { UpdateProfileData } from '@/domain/social/entities/user-profile.entity';

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(userId: string, data: UpdateProfileData): Promise<void> {
    if (data.username !== undefined) {
      const isAvailable = await this.profileRepository.isUsernameAvailable(data.username, userId);
      if (!isAvailable) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    await this.profileRepository.updateProfile(userId, data);
  }
}




