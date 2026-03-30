import type { AuthRepository } from '@/domain/auth/repository/user-repository.port';
import { SignUpDTO, AuthResult } from '../dto/auth.dto';

export class SignUpUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(dto: SignUpDTO): Promise<AuthResult> {
    if (!dto.email || !dto.password || !dto.username) {
      return { user: null, error: 'Todos los campos son requeridos' };
    }

    if (dto.password.length < 8) {
      return { user: null, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    return this.authRepository.signUp(dto.email, dto.password, dto.fullName, dto.username);
  }
}




