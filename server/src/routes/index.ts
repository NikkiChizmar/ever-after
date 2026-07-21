import { Router } from 'express';

import { authRouter } from './auth.route.js';
import { healthRouter } from './health.route.js';
import { weddingRouter } from './wedding.route.js';

/**
 * Central API router. Each domain mounts its own router here, keeping
 * route registration in one discoverable place.
 */
export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/weddings', weddingRouter);
