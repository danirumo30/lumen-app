import type { AuthRepository } from '@/modules/auth/domain/auth.repository';
import { User } from '@/modules/auth/domain/user.entity';

export interface SignInDTO {
  email: string;
  password: string;
}

export interface SignUpDTO {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

export interface AuthResult {
  user: User | null;
  error?: string;
  requiresVerification?: boolean;
}

export class SignInUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(dto: SignInDTO): Promise<AuthResult> {
    if (!dto.email || !dto.password) {
      return { user: null, error: 'Email y contraseña son requeridos' };
    }

    return this.authRepository.signIn(dto.email, dto.password);
  }
}

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

export class SignOutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}

export class GetSessionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<AuthResult> {
    return this.authRepository.getSession();
  }
}

