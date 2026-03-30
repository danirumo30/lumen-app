import { describe, it, expect } from 'vitest';
import { User } from '@/domain/auth/entities/user.entity';

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

  it('should return true for emailVerified when true', () => {
    const user = new User('123', 'test@example.com', true);
    expect(user.emailVerified).toBe(true);
  });

  it('should return false for emailVerified when false', () => {
    const user = new User('123', 'test@example.com', false);
    expect(user.emailVerified).toBe(false);
  });

  it('should create user from raw data (factory)', () => {
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
    expect(user.emailVerified).toBe(true);
  });

  it('should change email and reset verification', () => {
    const user = User.fromRaw({
      id: '123',
      email: 'old@example.com',
      emailVerified: true,
    });
    expect(user.emailVerified).toBe(true);
    
    user.changeEmail('new@example.com');
    expect(user.email).toBe('new@example.com');
    expect(user.emailVerified).toBe(false);
  });

  it('should verify email', () => {
    const user = User.fromRaw({
      id: '123',
      email: 'test@example.com',
      emailVerified: false,
    });
    user.verifyEmail();
    expect(user.emailVerified).toBe(true);
  });

  it('should update profile', () => {
    const user = User.fromRaw({
      id: '123',
      email: 'test@example.com',
      emailVerified: true,
      username: 'olduser',
      fullName: 'Old Name',
    });
    
    user.updateProfile(
      'https://new.avatar',
      'New Full Name',
      'newusername'
    );
    
    expect(user.avatarUrl).toBe('https://new.avatar');
    expect(user.fullName).toBe('New Full Name');
    expect(user.username).toBe('newusername');
  });

  it('should deactivate user', () => {
    const user = User.fromRaw({
      id: '123',
      email: 'test@example.com',
      emailVerified: true,
    });
    expect(user.isActive).toBe(true);
    
    user.deactivate();
    expect(user.isActive).toBe(false);
  });

  it('should compare equality', () => {
    const user1 = User.fromRaw({
      id: '123',
      email: 'test@example.com',
      emailVerified: true,
    });
    const user2 = User.fromRaw({
      id: '123',
      email: 'other@example.com',
      emailVerified: false,
    });
    const user3 = User.fromRaw({
      id: '456',
      email: 'test@example.com',
      emailVerified: true,
    });
    
    expect(user1.equals(user2)).toBe(true);
    expect(user1.equals(user3)).toBe(false);
  });
});
