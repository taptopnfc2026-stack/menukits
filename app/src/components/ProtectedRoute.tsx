/**
 * Route guard — redirects unauthenticated visitors to /login.
 * Preserves the originally requested location in router state so we
 * can bounce the user back after they sign in (used in the future).
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="admin-themed flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="admin-text-accent mx-auto h-8 w-8 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
