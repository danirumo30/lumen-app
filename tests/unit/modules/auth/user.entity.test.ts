import { describe, it, expect } from 'vitest';
import { User } from '@/modules/auth/domain/user.entity';

describe('User Entity', () => {
  it('should create a user with required fields', () => {
    const user = new User('123', 'test@example.com', true);
    
    expect(user.id).toBe('123');
    expect(user.email).toBe('test@example.com');
    expect(user.emailVerified).toBe(true);
  });

  it('should create a user with optional fields', () => {
    const user = new User('123', 'test@example.com', true, 'johndoe', 'John Doe', 'https://avatar.url');
    
    expect(user.username).toBe('johndoe');
    expect(user.fullName).toBe('John Doe');
    expect(user.avatarUrl).toBe('https://avatar.url');
  });

  it('should return true for isEmailVerified when emailVerified is true', () => {
    const user = new User('123', 'test@example.com', true);
    expect(user.isEmailVerified).toBe(true);
  });

  it('should return false for isEmailVerified when emailVerified is false', () => {
    const user = new User('123', 'test@example.com', false);
    expect(user.isEmailVerified).toBe(false);
  });

  it('should create user from raw data', () => {
    const user = User.fromRaw({
      id: '123',
      email: 'test@example.com',
      emailVerified: true,
      username: 'johndoe',
      fullName: 'John Doe',
      avatarUrl: 'https://avatar.url',
    });

    expect(user.id).toBe('123');
    expect(user.username).toBe('johndoe');
    expect(user.isEmailVerified).toBe(true);
  });
});
