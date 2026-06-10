'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiLogin, apiPatchProfile } from './backend-api';
import { FARMHOUSE_SESSION_UNAUTHORIZED } from './auth-session-events';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (body: { email: string; password?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'farmhouse-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: User; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    const nextUser: User = result.user;
    const nextToken: string = result.accessToken;
    setUser(nextUser);
    setToken(nextToken);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: nextUser, token: nextToken }),
      );
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const onSessionUnauthorized = () => {
      logout();
      if (pathname !== '/login') {
        router.replace('/login');
      }
    };
    window.addEventListener(FARMHOUSE_SESSION_UNAUTHORIZED, onSessionUnauthorized);
    return () => window.removeEventListener(FARMHOUSE_SESSION_UNAUTHORIZED, onSessionUnauthorized);
  }, [logout, router, pathname]);

  const updateProfile = useCallback(
    async (body: { email: string; password?: string }) => {
      if (!token) throw new Error('Not signed in');
      const result = await apiPatchProfile(token, {
        email: body.email.trim(),
        ...(body.password && body.password.length > 0 ? { password: body.password } : {}),
      });
      setUser(result.user);
      setToken(result.accessToken);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: result.user, token: result.accessToken }),
        );
      }
    },
    [token],
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
