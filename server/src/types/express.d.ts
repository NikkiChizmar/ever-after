import type { AuthUser } from '../lib/sessions.js';
import type { WeddingMembership } from '../middleware/wedding-access.js';

/**
 * Declaration merging: teaches TypeScript that our auth middleware attaches
 * `user` and `membership` to Express's Request. Optional because they only
 * exist after the relevant middleware has run.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      membership?: WeddingMembership;
    }
  }
}

export {};
