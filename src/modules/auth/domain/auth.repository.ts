import type { User } from '@supabase/supabase-js';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<{ user: User | null; error?: string }>;
  signUp(email: string, password: string, fullName: string, username: string): Promise<{ user: User | null; error?: string; requiresVerification: boolean }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ user: User | null; error?: string }>;
  verifyUserIntegrity(user: User | null): Promise<User | null>;
}
