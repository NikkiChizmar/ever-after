import pg from 'pg';
import type { PoolClient, QueryResultRow } from 'pg';

import { env } from '../config/env.js';

// pg is a CommonJS package; destructuring from the default import is the
// documented pattern for ESM consumers.
const { Pool } = pg;

export const pool = new Pool({ connectionString: env.DATABASE_URL });

/**
 * Typed query helper. Always uses parameterized queries ($1, $2…) — string
 * interpolation into SQL is how injection happens, so this signature makes
 * the safe path the only convenient one.
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/**
 * Run several statements atomically. If the callback throws, everything
 * rolls back — used wherever two writes must succeed or fail together
 * (e.g. create wedding + create owner membership).
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
