import { Navigate } from 'react-router-dom';

import { useWeddings } from '../hooks';

/**
 * "/" is a router, not a page: no wedding yet → onboarding;
 * otherwise → the (first) wedding's dashboard. When a wedding switcher
 * ships, "first" becomes "last visited".
 */
export function HomeRedirect() {
  const { data: weddings, isPending, isError, error } = useWeddings();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="px-6 py-20 text-center text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  if (weddings.length === 0) {
    return <Navigate to="/welcome" replace />;
  }

  return <Navigate to={`/w/${weddings[0]!.id}`} replace />;
}
