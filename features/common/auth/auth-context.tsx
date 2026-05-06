import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest } from '@/features/common/api/api-client';

const TOKEN_KEY = 'edu-ai-asistan.token';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readToken() {
  return (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
}

async function writeToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const res = await apiRequest('/api/v1/users/me', { token });
    setUser(res?.user || null);
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const t = await readToken();
        if (!mounted) return;
        setToken(t);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    void refreshMe().catch(() => {
      // Token invalid/expired: clear session
      void writeToken(null);
      setToken(null);
      setUser(null);
    });
  }, [token, refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest('/api/v1/users/login', {
      method: 'POST',
      body: { email, password },
    });
    const t = res?.token || null;
    await writeToken(t);
    setToken(t);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await apiRequest('/api/v1/users/register', {
      method: 'POST',
      body: { email, password, name },
    });
    const t = res?.token || null;
    await writeToken(t);
    setToken(t);
  }, []);

  const logout = useCallback(async () => {
    await writeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, loading, login, register, logout, refreshMe }),
    [token, user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

