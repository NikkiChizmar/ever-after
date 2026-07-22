import { Navigate, Outlet } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { useCurrentUser } from '../hooks';

/**
 * Route guard for everything behind login. Three states, three renders:
 * still asking the server → quiet loading; known logged-out → /login;
 * known user → the app shell with the requested page inside.
 */
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-foreground/70">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
