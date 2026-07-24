import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../lib/http-error.js';
import { SESSION_COOKIE, getUserForSession } from '../lib/sessions.js';

/**
 * Requires a valid session cookie; attaches the user to the request.
 * Express 5 catches rejected promises from async middleware automatically,
 * so thrown HttpErrors land in the central error handler.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
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
