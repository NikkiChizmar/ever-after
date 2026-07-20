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

  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());

  app.use('/api', apiRouter);

  app.use(errorHandler);

  return app;
}
