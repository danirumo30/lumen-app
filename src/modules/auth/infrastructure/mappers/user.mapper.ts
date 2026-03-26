import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/modules/auth/domain/user.entity';


export class UserMapper {
  
  static fromSupabase(supabaseUser: SupabaseUser): User {
    return User.fromRaw({
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      emailVerified: !!supabaseUser.email_confirmed_at,
      username: supabaseUser.user_metadata?.username as string | undefined,
      fullName: supabaseUser.user_metadata?.full_name as string | undefined,
      avatarUrl: supabaseUser.user_metadata?.avatar_url as string | undefined,
    });
  }

  
  static toSupabase(user: User): Partial<SupabaseUser> {
    return {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.emailVerified ? new Date().toISOString() : undefined,
      user_metadata: {
        username: user.username,
        full_name: user.fullName,
        avatar_url: user.avatarUrl,
      },
    };
  }
}
