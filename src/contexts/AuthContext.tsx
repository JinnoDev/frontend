'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authApi, usersApi } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (): Promise<User | null> => {
    try {
      const res = await usersApi.getMe();
      return res.data;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Cookies.remove('accessToken');
      }
      return null;
    }
  };

  const refreshUser = async () => {
    const me = await fetchMe();
    setUser(me);
  };

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) { setLoading(false); return; }
    fetchMe().then(me => { setUser(me); setLoading(false); });
  }, []);

  const login = async (email: string, password: string) => {
    // Always clear previous session before logging in
    Cookies.remove('accessToken');
    setUser(null);

    const res = await authApi.login({ email, password });
    Cookies.set('accessToken', res.data.accessToken, { expires: 7 });

    const me = await fetchMe();
    setUser(me);
  };

  const register = async (email: string, username: string, password: string) => {
    Cookies.remove('accessToken');
    setUser(null);

    const res = await authApi.register({ email, username, password });
    Cookies.set('accessToken', res.data.accessToken, { expires: 7 });

    const me = await fetchMe();
    setUser(me);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    Cookies.remove('accessToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
