import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

/**
 * App assembly is separated from server startup (src/index.ts) so tests can
 * import the app and make requests against it without opening a network port.
 */
export function createApp() {
  const app = express();

  // credentials: true lets the browser send the session cookie cross-origin
  // (only to the allowlisted client origin).
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', apiRouter);

  // JSON 404 for unknown API paths — consistent error shape everywhere.
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found' } });
  });

  app.use(errorHandler);

  return app;
}
