

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface UserPublicProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}




