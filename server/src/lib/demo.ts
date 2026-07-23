import { query } from '../db/pool.js';
import type { AuthUser } from './sessions.js';

/**
 * The one account the public read-only demo ever authenticates as. Created
 * by scripts/seed-demo.ts (which also gives it a 'viewer' membership on the
 * seeded demo wedding — that role, not this file, is what actually makes
 * the demo read-only; see requireWeddingRole). Fixed rather than
 * configurable because there's exactly one demo deployment and one demo
 * dataset — a second knob here would be speculative.
 */
export const DEMO_USER_EMAIL = 'demo@everafter.app';

// Looked up once per process rather than once per request: this is on the
// hot path of every single API call in demo mode (requireAuth runs on
// nearly every route), and the row never changes after the seed script runs.
let cachedDemoUser: AuthUser | null = null;

export async function getDemoUser(): Promise<AuthUser> {
  if (cachedDemoUser) {
    return cachedDemoUser;
  }

  const rows = await query<AuthUser>(
    `SELECT id, email, full_name AS "fullName" FROM users WHERE email = $1`,
    [DEMO_USER_EMAIL],
  );
  const user = rows[0];
  if (!user) {
    // A misconfigured demo deployment (DEMO_MODE=true, seed script never
    // run) should fail loudly on the first request, not silently 500 deep
    // inside a query that assumes req.user exists.
    throw new Error(
      `DEMO_MODE is enabled but no user exists with email ${DEMO_USER_EMAIL} — run scripts/seed-demo.ts`,
    );
  }

  cachedDemoUser = user;
  return user;
}
