import type { AuthRepository } from '@/domain/auth/repository/user-repository.port';
import { SignInDTO, AuthResult } from '../dto/auth.dto';

export class SignInUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(dto: SignInDTO): Promise<AuthResult> {
    if (!dto.email || !dto.password) {
      return { user: null, error: 'Email y contraseña son requeridos' };
    }

    return this.authRepository.signIn(dto.email, dto.password);
  }
}




