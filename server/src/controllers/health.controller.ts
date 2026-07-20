import type { Request, Response } from 'express';

/**
 * GET /api/health
 * Liveness check used by the client, uptime monitors, and deploy pipelines.
 */
export function getHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    service: 'ever-after-api',
    timestamp: new Date().toISOString(),
  });
}
