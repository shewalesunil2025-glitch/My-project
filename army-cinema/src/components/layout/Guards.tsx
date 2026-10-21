import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/States';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <LoadingState label="Checking your session…" className="min-h-[50vh]" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <LoadingState label="Checking access…" className="min-h-screen" />;
  if (!user || user.role !== 'admin') return <Navigate to={`/admin/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
