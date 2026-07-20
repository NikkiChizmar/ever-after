import { Router } from 'express';

import { healthRouter } from './health.route.js';

/**
 * Central API router. Each domain (budget, guests, vendors…) will mount its
 * own router here, keeping route registration in one discoverable place.
 */
export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
