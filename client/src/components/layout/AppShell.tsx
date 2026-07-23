import type { ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
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
              <TabNav
                tabs={[
                  { to: `/w/${weddingId}`, label: 'Dashboard' },
                  { to: `/w/${weddingId}/budget`, label: 'Budget' },
                  { to: `/w/${weddingId}/vendors`, label: 'Vendors' },
                ]}
              />
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

/**
 * Tab group with a single highlight pill that slides between tabs on
 * navigation, rather than each tab independently toggling its own
 * background. Position/width are measured off the active <Link>'s real DOM
 * box (tab labels aren't equal width — "Dashboard" vs "Budget" — so a fixed
 * offset per index would look wrong), then applied via a CSS transition on
 * a single absolutely-positioned element sitting behind the tab labels.
 */
function TabNav({ tabs }: { tabs: { to: string; label: string }[] }) {
  const { pathname } = useLocation();
  const activeIndex = tabs.findIndex((tab) => tab.to === pathname);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = linkRefs.current[activeIndex];
      if (el) {
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <nav className="relative flex items-center gap-1">
      {indicator && (
        <span
          aria-hidden="true"
          className="bg-nav-active absolute inset-y-0 rounded-md transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {tabs.map((tab, index) => (
        <Link
          key={tab.to}
          to={tab.to}
          ref={(el) => {
            linkRefs.current[index] = el;
          }}
          className={cn(
            'relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            index === activeIndex
              ? 'text-nav-active-foreground'
              : 'text-foreground/70 hover:text-foreground',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
