'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabaseClient';

interface User {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabaseClient) {
      // Supabase is not configured (likely missing env vars); stay logged out
      // but don't crash the app.
      setIsLoading(false);
      return;
    }

    // Initialise from current session and subscribe to auth state changes.
    // onAuthStateChange fires immediately with the current session on mount,
    // then on every login / logout / token refresh, so there is no need for
    // a separate "verifyToken" call.
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const accessToken = session.access_token;
        setToken(accessToken);
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username as string | undefined,
        });
        // Keep the existing localStorage key so apiClient.ts needs no changes.
        localStorage.setItem('authToken', accessToken);
        if (session.refresh_token) {
          localStorage.setItem('refreshToken', session.refresh_token);
        }
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    if (!supabaseClient) {
      throw new Error('Authentication is not configured. Please contact support.');
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(
        error.message === 'Email not confirmed'
          ? 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
          : error.message === 'Invalid login credentials'
            ? 'Invalid credentials'
            : error.message,
      );
    }

    if (!data.session || !data.user) {
      throw new Error('Login failed');
    }
    // onAuthStateChange will update state; nothing extra needed here.
  };

  const register = async (email: string, password: string, username?: string): Promise<void> => {
    if (!supabaseClient) {
      throw new Error('Authentication is not configured. Please contact support.');
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username ?? email.split('@')[0],
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed');
    }

    // When email confirmation is required, session is null and the user must
    // verify their address before they can sign in.
    if (!data.session) {
      throw new Error('User created. Please check your email to verify your account.');
    }
    // onAuthStateChange will update state; nothing extra needed here.
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    if (!supabaseClient) {
      throw new Error('Authentication is not configured. Please contact support.');
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async (): Promise<void> => {
    if (!supabaseClient) {
      // Nothing to do if auth is not configured.
      setUser(null);
      setToken(null);
      return;
    }

    await supabaseClient.auth.signOut();
    // onAuthStateChange will clear state and localStorage automatically.
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, changePassword, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
