import crypto from 'node:crypto';

import { env } from '../config/env.js';
import { query } from '../db/pool.js';

export const SESSION_COOKIE = 'ea_session';
export const SESSION_TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Sessions: a 256-bit random token lives in an httpOnly cookie; only its
 * SHA-256 hash is stored. Unlike passwords, tokens are high-entropy random
 * values, so a fast hash is appropriate — bcrypt here would just slow down
 * every authenticated request.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    userId,
    hashToken(token),
    expiresAt,
  ]);
  return { token, expiresAt };
}

export async function getUserForSession(token: string): Promise<AuthUser | null> {
  const rows = await query<AuthUser>(
    `SELECT u.id, u.email, u.full_name AS "fullName"
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function destroySession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}
