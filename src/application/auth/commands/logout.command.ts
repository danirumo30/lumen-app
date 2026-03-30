import type { AuthRepository } from '@/domain/auth/repository/user-repository.port';

export class SignOutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}




