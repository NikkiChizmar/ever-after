import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

/**
 * The authenticated frame: brand, wedding-scoped nav, user identity, sign out.
 * Nav only appears once a :weddingId is in the URL — there's nothing to
 * navigate between on the welcome/onboarding screen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { weddingId } = useParams<{ weddingId?: string }>();
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
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-xl font-medium tracking-tight">
              Ever After
            </Link>
            {weddingId && (
              <nav className="flex items-center gap-1">
                <NavLink to={`/w/${weddingId}`} label="Dashboard" />
                <NavLink to={`/w/${weddingId}/budget`} label="Budget" />
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/70">{user?.fullName}</span>
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

function NavLink({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-accent text-accent-foreground' : 'text-foreground/70 hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );
}
