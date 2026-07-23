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

  // Belt-and-suspenders read-only enforcement for the public demo: the
  // seeded demo account's 'viewer' role already blocks every mutation
  // through the normal role-rank check (see requireWeddingRole), but this
  // catches routes that check auth only, not role — register/login (moot
  // anyway, since there's no real login in demo mode) and create-wedding —
  // so "demo mode = nothing can be written, full stop" doesn't depend on
  // every route remembering to gate itself correctly.
  if (env.DEMO_MODE) {
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(403).json({
          error: { message: 'This is a read-only public demo — nothing here can be changed.' },
        });
        return;
      }
      next();
    });
  }

  app.use('/api', apiRouter);

  // JSON 404 for unknown API paths — consistent error shape everywhere.
  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Not found' } });
  });

  app.use(errorHandler);

  return app;
}
