import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

/**
 * The authenticated frame: brand, user identity, sign out.
 * Navigation (Budget, Guests, Tasks…) joins this header as modules ship.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-medium tracking-tight">
            Ever After
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.fullName}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
