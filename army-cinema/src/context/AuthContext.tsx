import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import { AppError } from '@/services/errors';
import type { Profile } from '@/types';
import { useToast } from './ToastContext';

interface AuthState {
  user: Profile | null;
  ready: boolean;
  setUser: (u: Profile | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      setUser(await api.getCurrentUser());
    } catch (e) {
      setUser((prev) => {
        if (prev && e instanceof AppError && e.code === 'SESSION_EXPIRED') {
          toast.warning('Session expired', 'For your security you’ve been logged out. Please log in again.');
        }
        return null;
      });
    } finally {
      setReady(true);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
    // Re-check the session when the tab regains focus and every minute.
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, setUser, refresh, logout }), [user, ready, refresh, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
