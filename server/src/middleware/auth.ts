import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { getDemoUser } from '../lib/demo.js';
import { HttpError } from '../lib/http-error.js';
import { SESSION_COOKIE, getUserForSession } from '../lib/sessions.js';

/**
 * Requires a valid session cookie; attaches the user to the request.
 * Express 5 catches rejected promises from async middleware automatically,
 * so thrown HttpErrors land in the central error handler.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // The public demo has no real login — every visitor is silently the same
  // fixed, viewer-only account. This is the only place that's true; every
  // downstream check (role, ownership) runs exactly as it does for a real
  // user, which is what makes the demo's read-only-ness trustworthy rather
  // than a UI-only illusion.
  if (env.DEMO_MODE) {
    req.user = await getDemoUser();
    return next();
  }

  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) {
    throw new HttpError(401, 'Authentication required');
  }

  const user = await getUserForSession(token);
  if (!user) {
    throw new HttpError(401, 'Session expired or invalid');
  }

  req.user = user;
  next();
}
