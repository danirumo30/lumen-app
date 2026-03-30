'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/domain/auth/entities/user.entity';
import { SupabaseAuthRepository } from '@/infrastructure/persistence/supabase/auth/supabase-auth.repository';

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

const authRepository = new SupabaseAuthRepository();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExtendedAuthState>({
    ...initialState,
    requiresVerification: false,
  });

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};





