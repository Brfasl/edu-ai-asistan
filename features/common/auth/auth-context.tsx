import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

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
  socialLogin: (
    provider: 'google' | 'apple',
    idToken?: string,
    name?: string,
    options?: { code?: string; redirectUri?: string }
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function canUseWebStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

async function canUseSecureStore() {
  try {
    if (typeof SecureStore?.getItemAsync !== 'function' || typeof SecureStore?.setItemAsync !== 'function') {
      return false;
    }
    if (typeof SecureStore?.isAvailableAsync === 'function') {
      return await SecureStore.isAvailableAsync();
    }
    return true;
  } catch {
    return false;
  }
}

async function readToken() {
  if (await canUseSecureStore()) {
    try {
      return (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
    } catch {
      // fall through to web storage
    }
  }
  if (canUseWebStorage()) {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

async function writeToken(token: string | null) {
  if (await canUseSecureStore()) {
    try {
      if (!token) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
      return;
    } catch {
      // fall through to web storage
    }
  }
  if (canUseWebStorage()) {
    try {
      if (!token) window.localStorage.removeItem(TOKEN_KEY);
      else window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }
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

  const socialLogin = useCallback(
    async (
      provider: 'google' | 'apple',
      idToken?: string,
      name?: string,
      options?: { code?: string; redirectUri?: string }
    ) => {
      const res = await apiRequest('/api/v1/users/social-login', {
        method: 'POST',
        body: {
          provider,
          idToken,
          name,
          code: options?.code,
          redirectUri: options?.redirectUri,
        },
      });
      const t = res?.token || null;
      await writeToken(t);
      setToken(t);
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    await apiRequest('/api/v1/users/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await apiRequest('/api/v1/users/reset-password', {
        method: 'POST',
        body: { email, code, newPassword },
      });
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const t = await readToken();
      await apiRequest('/api/v1/users/change-password', {
        method: 'POST',
        token: t ?? undefined,
        body: { currentPassword, newPassword },
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await writeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      socialLogin,
      forgotPassword,
      resetPassword,
      changePassword,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, register, socialLogin, forgotPassword, resetPassword, changePassword, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
