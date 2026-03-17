import { describe, it, expect, vi } from 'vitest';
import { SignInUseCase, SignUpUseCase } from '@/modules/auth/application/use-cases';

// Mock repository
const createMockRepository = () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  verifyUserIntegrity: vi.fn(),
});

describe('SignInUseCase', () => {
  const mockRepository = createMockRepository();
  const useCase = new SignInUseCase(mockRepository);

  it('should return error when email is empty', async () => {
    const result = await useCase.execute({ email: '', password: 'password123' });
    
    expect(result.error).toBe('Email y contraseña son requeridos');
    expect(mockRepository.signIn).not.toHaveBeenCalled();
  });

  it('should return error when password is empty', async () => {
    const result = await useCase.execute({ email: 'test@example.com', password: '' });
    
    expect(result.error).toBe('Email y contraseña son requeridos');
    expect(mockRepository.signIn).not.toHaveBeenCalled();
  });

  it('should call repository when valid credentials', async () => {
    const mockUser = { id: '123', email: 'test@example.com', emailVerified: true } as any;
    mockRepository.signIn.mockResolvedValue({ user: mockUser });
    
    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });
    
    expect(mockRepository.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result.user).toEqual(mockUser);
  });

  it('should return error from repository on failure', async () => {
    mockRepository.signIn.mockResolvedValue({ user: null, error: 'Invalid credentials' });
    
    const result = await useCase.execute({ email: 'test@example.com', password: 'wrongpassword' });
    
    expect(result.error).toBe('Invalid credentials');
  });
});

describe('SignUpUseCase', () => {
  const mockRepository = createMockRepository();
  const useCase = new SignUpUseCase(mockRepository);

  it('should return error when email is missing', async () => {
    const result = await useCase.execute({ email: '', password: 'Password123', fullName: 'John', username: 'john' });
    
    expect(result.error).toBe('Todos los campos son requeridos');
  });

  it('should return error when password is too short', async () => {
    const result = await useCase.execute({ email: 'test@example.com', password: 'Pass', fullName: 'John', username: 'john' });
    
    expect(result.error).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('should call repository when valid data', async () => {
    mockRepository.signUp.mockResolvedValue({ user: null, requiresVerification: true });
    
    const result = await useCase.execute({ 
      email: 'test@example.com', 
      password: 'Password123', 
      fullName: 'John Doe', 
      username: 'johndoe' 
    });
    
    expect(mockRepository.signUp).toHaveBeenCalledWith('test@example.com', 'Password123', 'John Doe', 'johndoe');
    expect(result.requiresVerification).toBe(true);
  });
});
