import { createClient, type User as SupabaseUser, type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import type { AuthRepository } from '@/modules/auth/domain/auth.repository';
import { User } from '@/modules/auth/domain/user.entity';
import { UserMapper } from '@/modules/auth/infrastructure/mappers/user.mapper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin client for integrity checks
const getSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured. User integrity checks disabled.');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export class SupabaseAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { user: null, error: error.message };
      }

      let supabaseUser = data.session?.user ?? null;
      
      // Verify user integrity and email confirmation
      if (supabaseUser) {
        const integrityResult = await this.verifyUserIntegrity(UserMapper.fromSupabase(supabaseUser));
        if (!integrityResult) {
          await supabase.auth.signOut();
          return { user: null, error: 'La cuenta de usuario no existe o ha sido eliminada.' };
        }
        
        if (!supabaseUser.email_confirmed_at) {
          await supabase.auth.signOut();
          return { user: null, error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' };
        }
      }
      
      const user = supabaseUser ? UserMapper.fromSupabase(supabaseUser) : null;
      return { user };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { user: null, error: message };
    }
  }

  async signUp(email: string, password: string, fullName: string, username: string): Promise<{ user: User | null; error?: string; requiresVerification: boolean }> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: data.error || 'Registration failed', requiresVerification: false };
      }

      return { user: null, requiresVerification: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { user: null, error: message, requiresVerification: false };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession(): Promise<{ user: User | null; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return { user: null, error: error.message };
      }
      
      const supabaseUser = session?.user ?? null;
      const supabaseUserVerified = supabaseUser ? await this.verifyUserIntegrityBySupabase(supabaseUser) : null;
      const user = supabaseUserVerified ? UserMapper.fromSupabase(supabaseUserVerified) : null;
      
      return { user };
    } catch (err) {
      return { user: null, error: 'Failed to get session' };
    }
  }

  async verifyUserIntegrity(user: User | null): Promise<User | null> {
    if (!user) return null;
    
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return user;

    try {
      const { error } = await adminClient.auth.admin.getUserById(user.id);
      if (error) {
        console.log(`User ${user.id} not found in database.`);
        return null;
      }
      return user;
    } catch (adminCheckError) {
      console.error('Error verifying user integrity:', adminCheckError);
      return user; // Conservative approach: keep user on error
    }
  }

  // Helper method to verify Supabase user integrity (returns Supabase user)
  private async verifyUserIntegrityBySupabase(user: SupabaseUser | null): Promise<SupabaseUser | null> {
    if (!user) return null;
    
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return user;

    try {
      const { error } = await adminClient.auth.admin.getUserById(user.id);
      if (error) {
        console.log(`User ${user.id} not found in database.`);
        return null;
      }
      return user;
    } catch (adminCheckError) {
      console.error('Error verifying user integrity:', adminCheckError);
      return user; // Conservative approach: keep user on error
    }
  }
  
  // Expose subscription method for the Context
  onAuthChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const supabaseUser = session?.user ?? null;
        const supabaseUserVerified = supabaseUser ? await this.verifyUserIntegrityBySupabase(supabaseUser) : null;
        const user = supabaseUserVerified ? UserMapper.fromSupabase(supabaseUserVerified) : null;
        callback(user);
      }
    );
    
    return () => subscription.unsubscribe();
  }
}
