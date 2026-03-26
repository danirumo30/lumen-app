import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import type { AuthRepository } from '@/modules/auth/domain/auth.repository';
import { User } from '@/modules/auth/domain/user.entity';
import { UserMapper } from '@/modules/auth/infrastructure/mappers/user.mapper';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: true, persistSession: true },
});


const getAdminClient = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured');
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export class SupabaseAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) return { user: null, error: error.message };

      const supabaseUser = data.session?.user;
      if (!supabaseUser) return { user: null };

      
      const isValid = await this.verifyUserExists(supabaseUser.id);
      if (!isValid) {
        await supabase.auth.signOut();
        return { user: null, error: 'Usuario no encontrado o eliminado' };
      }

      if (!supabaseUser.email_confirmed_at) {
        await supabase.auth.signOut();
        return { user: null, error: 'Por favor, verifica tu correo electrónico' };
      }

      return { user: UserMapper.fromSupabase(supabaseUser) };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err.message : 'Login failed' };
    }
  }

  async signUp(email: string, password: string, fullName: string, username: string): Promise<{ user: User | null; error?: string; requiresVerification: boolean }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, username }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { user: null, error: data.error || 'Registration failed', requiresVerification: false };
      }

      return { user: null, requiresVerification: true };
    } catch (err) {
      return { user: null, error: err instanceof Error ? err.message : 'Registration failed', requiresVerification: false };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession(): Promise<{ user: User | null; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) return { user: null, error: error.message };

      const supabaseUser = session?.user;
      if (!supabaseUser) return { user: null };

      const isValid = await this.verifyUserExists(supabaseUser.id);
      if (!isValid) return { user: null };

      return { user: UserMapper.fromSupabase(supabaseUser) };
    } catch {
      return { user: null, error: 'Failed to get session' };
    }
  }

  
  private async verifyUserExists(userId: string): Promise<boolean> {
    const adminClient = getAdminClient();
    if (!adminClient) return true; 

    try {
      const { error } = await adminClient.auth.admin.getUserById(userId);
      return !error;
    } catch {
      return true; 
    }
  }

  
  onAuthChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const supabaseUser = session?.user ?? null;
        const user = supabaseUser ? UserMapper.fromSupabase(supabaseUser) : null;
        callback(user);
      }
    );
    
    return () => subscription.unsubscribe();
  }

  
  async verifyUserIntegrity(user: User | null): Promise<User | null> {
    if (!user) return null;
    const isValid = await this.verifyUserExists(user.id);
    return isValid ? user : null;
  }
}

