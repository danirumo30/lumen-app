import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';

export class SearchUsersUseCase {
  constructor(private readonly profileRepository: UserProfileRepository) {}

  async execute(query: string, limit: number = 20): Promise<ReturnType<typeof this.profileRepository.searchUsers>> {
    if (!query || query.length < 2) {
      return [];
    }
    return this.profileRepository.searchUsers(query, limit);
  }
}




