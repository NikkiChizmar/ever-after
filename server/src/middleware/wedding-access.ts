import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

/**
 * Role hierarchy as ranks: "editor or above" is a number comparison,
 * and adding a role later is one entry here — not a rewrite of every check.
 */
const ROLE_RANK = { viewer: 0, editor: 1, owner: 2 } as const;

export type WeddingRole = keyof typeof ROLE_RANK;

export interface WeddingMembership {
  weddingId: string;
  role: WeddingRole;
}

const uuidSchema = z.string().uuid();

/**
 * Authorizes access to routes under /weddings/:weddingId.
 *
 * Non-members get 404, not 403 — a deliberate information-hiding choice:
 * "you can't see this" confirms the wedding exists; "not found" doesn't.
 * Malformed IDs also 404 for the same reason (and so Postgres never sees
 * an invalid uuid, which would otherwise surface as a 500).
 */
export function requireWeddingRole(minRole: WeddingRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const parsed = uuidSchema.safeParse(req.params.weddingId);
    if (!parsed.success) {
      throw new HttpError(404, 'Wedding not found');
    }
    const weddingId = parsed.data;

    const rows = await query<{ role: WeddingRole }>(
      `SELECT role FROM wedding_members
        WHERE wedding_id = $1 AND user_id = $2 AND status = 'active'`,
      [weddingId, req.user!.id],
    );

    const role = rows[0]?.role;
    if (!role) {
      throw new HttpError(404, 'Wedding not found');
    }
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw new HttpError(403, 'Your role does not permit this action');
    }

    req.membership = { weddingId, role };
    next();
  };
}
