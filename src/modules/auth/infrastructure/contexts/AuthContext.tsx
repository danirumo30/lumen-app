'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/modules/auth/domain/user.entity';
import { SupabaseAuthRepository } from '@/modules/auth/infrastructure/repositories/supabase-auth.repository';

// Environment constants
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Types
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface ExtendedAuthState extends AuthState {
  requiresVerification: boolean;
}

interface AuthContextType extends ExtendedAuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setRequiresVerification: (value: boolean) => void;
  updateUser: (updates: Partial<Pick<User, 'avatarUrl' | 'username' | 'fullName'>>) => void;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Repository instance
const authRepository = new SupabaseAuthRepository();

// Helper: Fetch user profile from database
const fetchUserProfile = async (userId: string): Promise<{ avatarUrl?: string } | null> => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    return data ? { avatarUrl: data.avatar_url } : null;
  } catch {
    console.warn('Could not fetch profile data');
    return null;
  }
};

// Helper: Build user entity from Supabase user + profile
const buildUserFromSupabase = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser) return null;
  
  const profile = await fetchUserProfile(supabaseUser.id);
  return new User(
    supabaseUser.id,
    supabaseUser.email ?? '',
    supabaseUser.email_confirmed_at !== null,
    supabaseUser.user_metadata?.username as string | undefined,
    supabaseUser.user_metadata?.full_name as string | undefined,
    profile?.avatarUrl
  );
};

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExtendedAuthState>({
    ...initialState,
    requiresVerification: false,
  });

  // Check session on mount and listen for auth changes
  useEffect(() => {
    const initSession = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      const { user } = await authRepository.getSession();
      setState(prev => ({ ...prev, user, isLoading: false }));
    };

    initSession();

    const unsubscribe = authRepository.onAuthChange(async (user) => {
      setState(prev => ({ ...prev, user, isLoading: false }));
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const { user, error } = await authRepository.signIn(email, password);
    
    if (error) {
      setState(prev => ({ ...prev, error, isLoading: false }));
      throw new Error(error);
    }
    
    setState(prev => ({ ...prev, user, isLoading: false }));
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, username: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const { user, error, requiresVerification } = await authRepository.signUp(email, password, fullName, username);
    
    if (error) {
      setState(prev => ({ ...prev, error, isLoading: false }));
      throw new Error(error);
    }
    
    setState(prev => ({ ...prev, user, requiresVerification, isLoading: false }));
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await authRepository.signOut();
    setState(prev => ({ ...prev, user: null, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setRequiresVerification = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, requiresVerification: value }));
  }, []);

  const updateUser = useCallback((updates: Partial<Pick<User, 'avatarUrl' | 'username' | 'fullName'>>) => {
    setState(prev => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: new User(
          prev.user.id,
          prev.user.email,
          prev.user.emailVerified,
          updates.username ?? prev.user.username,
          updates.fullName ?? prev.user.fullName,
          updates.avatarUrl ?? prev.user.avatarUrl
        ),
      };
    });
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError,
    setRequiresVerification,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
