import type { AuthRepository } from '@/domain/auth/repository/user-repository.port';
import { AuthResult } from '../dto/auth.dto';

export class GetSessionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<AuthResult> {
    return this.authRepository.getSession();
  }
}




