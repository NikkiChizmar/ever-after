import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';

/**
 * Centralized error handler — the last middleware in the chain.
 * Controllers can throw (or call next(err)) and every error funnels through
 * here, so error logging and response shape stay consistent across the API.
 * Stack traces are only exposed outside production.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  res.status(500).json({
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}
