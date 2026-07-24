/**
 * True only in the dedicated public-demo build (VITE_DEMO_MODE=true set in
 * that deployment's environment, never in local dev). Two things key off
 * this: lib/api.ts routes every request to lib/mockApi.ts instead of a
 * real backend (there isn't one — see docs/deploying-the-demo.md), and the
 * UI disables write controls / shows the "this is sample data" banner so a
 * visitor never has to discover the read-only-ness by trying something and
 * getting an error.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
