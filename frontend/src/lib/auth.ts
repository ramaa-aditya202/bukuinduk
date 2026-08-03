'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSSO: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
  canViewSensitive: boolean;
  canExport: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cek auth state saat mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
      // Verify token masih valid
      api.get('/auth/me')
        .then((res) => {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login lokal (email + password)
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  // Login via SSO Authentik
  const loginWithSSO = async () => {
    const res = await api.get('/auth/authentik/redirect');
    window.location.href = res.data.redirect_url;
  };

  // Logout
  const logout = async () => {
    try {
      const res = await api.post('/auth/logout');

      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);

      // Redirect ke SLO Authentik jika SSO user
      if (res.data.slo_redirect_url) {
        window.location.href = res.data.slo_redirect_url;
      } else {
        router.push('/login');
      }
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const canViewSensitive = user ? ['super_admin', 'admin_tu'].includes(user.role) : false;
  const canExport = user ? ['super_admin', 'admin_tu'].includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithSSO,
        logout,
        isAuthenticated: !!user,
        hasRole,
        canViewSensitive,
        canExport,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
