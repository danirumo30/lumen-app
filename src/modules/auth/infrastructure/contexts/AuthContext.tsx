'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthRepository } from '@/modules/auth/infrastructure/repositories/supabase-auth.repository';

// Types
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface ExtendedAuthState extends AuthState {
  requiresVerification: boolean;
}

interface AuthContextType extends AuthState {
  requiresVerification: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setRequiresVerification: (value: boolean) => void;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Repository instance (could be injected in a more complex setup)
const authRepository = new SupabaseAuthRepository();

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExtendedAuthState>({
    ...initialState,
    requiresVerification: false,
  });

  // Check session on mount and listen for changes
  useEffect(() => {
    const checkSession = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const { user, error } = await authRepository.getSession();
        
        if (error) {
           setState(prev => ({
             ...prev,
             user: null,
             requiresVerification: false,
             isLoading: false,
           }));
           return;
        }

        setState(prev => ({
          ...prev,
          user,
          isLoading: false,
        }));
      } catch {
        setState(prev => ({
          ...prev,
          user: null,
          requiresVerification: false,
          isLoading: false,
        }));
      }
    };

    checkSession();

    // Subscribe to auth changes
    const unsubscribe = authRepository.onAuthChange((user) => {
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
      }));
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, error } = await authRepository.signIn(email, password);
      
      if (error) {
        setState(prev => ({
          ...prev,
          error,
          isLoading: false,
        }));
        throw new Error(error);
      }
      
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState(prev => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, username: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, error, requiresVerification } = await authRepository.signUp(email, password, fullName, username);
      
      if (error) {
        setState(prev => ({
          ...prev,
          error,
          isLoading: false,
        }));
        throw new Error(error);
      }
      
      setState(prev => ({
        ...prev,
        user,
        requiresVerification,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setState(prev => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authRepository.signOut();
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Logout failed',
        isLoading: false,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setRequiresVerification = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, requiresVerification: value }));
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError,
    setRequiresVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};