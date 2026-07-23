/**
 * True only in the dedicated public-demo build (VITE_DEMO_MODE=true set in
 * that deployment's environment, never in local dev). The backend is the
 * actual source of truth for read-only-ness — every write request 403s
 * regardless of what the client does (see server/src/app.ts) — this flag
 * only controls presentation: disabling write controls before a visitor
 * gets a confusing error, and showing the "this is sample data" banner.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
