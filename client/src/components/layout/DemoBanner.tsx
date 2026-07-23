import { DEMO_MODE } from '@/lib/demo';

/**
 * Sits above the app shell on every page of the public demo deployment —
 * rendered once in App.tsx, outside RequireAuth, so it shows on every route
 * including the (unreachable in practice, but still technically routable)
 * public ones. Absent entirely — not just hidden — outside the demo build,
 * since DEMO_MODE is resolved at build time (see lib/demo.ts).
 */
export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="bg-nav-active text-nav-active-foreground px-6 py-2 text-center text-sm font-medium">
      You're viewing a live demo — every couple, vendor, and task shown is sample data, not real. Nothing
      you do here is saved.
    </div>
  );
}
