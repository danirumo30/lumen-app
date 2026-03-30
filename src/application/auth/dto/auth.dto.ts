import { User } from '@/domain/auth/entities/user.entity';

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




