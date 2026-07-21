import { query, withTransaction } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';
import type { WeddingRole } from '../middleware/wedding-access.js';

export interface Wedding {
  id: string;
  name: string;
  weddingDate: string | null;
  currency: string;
  totalBudget: string | null; // numeric comes back as string — exact, never floated
  createdAt: string;
}

const WEDDING_COLUMNS = `
  id, name,
  wedding_date AS "weddingDate",
  currency,
  total_budget AS "totalBudget",
  created_at  AS "createdAt"
`;

interface CreateWeddingInput {
  name: string;
  weddingDate?: string;
  currency?: string;
  totalBudget?: number;
}

/**
 * Creating a wedding and making the creator its owner must be atomic:
 * a wedding with zero owners is unreachable garbage, so both inserts
 * share a transaction.
 */
export async function createWedding(userId: string, input: CreateWeddingInput): Promise<Wedding> {
  return withTransaction(async (tx) => {
    const weddingResult = await tx.query<Wedding>(
      `INSERT INTO weddings (name, wedding_date, currency, total_budget)
       VALUES ($1, $2, $3, $4)
       RETURNING ${WEDDING_COLUMNS}`,
      [input.name, input.weddingDate ?? null, input.currency ?? 'USD', input.totalBudget ?? null],
    );
    const wedding = weddingResult.rows[0]!;

    await tx.query(
      `INSERT INTO wedding_members (wedding_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')`,
      [wedding.id, userId],
    );

    return wedding;
  });
}

export async function listWeddingsForUser(userId: string): Promise<(Wedding & { role: WeddingRole })[]> {
  return query<Wedding & { role: WeddingRole }>(
    `SELECT w.id, w.name,
            w.wedding_date AS "weddingDate",
            w.currency,
            w.total_budget AS "totalBudget",
            w.created_at  AS "createdAt",
            m.role
       FROM weddings w
       JOIN wedding_members m ON m.wedding_id = w.id
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY w.created_at`,
    [userId],
  );
}

export async function getWedding(weddingId: string): Promise<Wedding> {
  const rows = await query<Wedding>(
    `SELECT ${WEDDING_COLUMNS} FROM weddings WHERE id = $1`,
    [weddingId],
  );
  const wedding = rows[0];
  if (!wedding) {
    throw new HttpError(404, 'Wedding not found');
  }
  return wedding;
}

interface UpdateWeddingInput {
  name?: string;
  weddingDate?: string | null;
  currency?: string;
  totalBudget?: number | null;
}

/**
 * Partial update built dynamically: only fields present in the input reach
 * the SET clause, so `weddingDate: null` clears the date while omitting it
 * leaves the date untouched — a distinction COALESCE-style updates can't make.
 * Column names come from this allowlist, never from user input.
 */
export async function updateWedding(weddingId: string, input: UpdateWeddingInput): Promise<Wedding> {
  const columnFor: Record<string, string> = {
    name: 'name',
    weddingDate: 'wedding_date',
    currency: 'currency',
    totalBudget: 'total_budget',
  };

  const sets: string[] = [];
  const params: unknown[] = [weddingId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateWeddingInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getWedding(weddingId);
  }

  const rows = await query<Wedding>(
    `UPDATE weddings SET ${sets.join(', ')} WHERE id = $1 RETURNING ${WEDDING_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: WeddingRole;
  status: string;
}

export async function listMembers(weddingId: string): Promise<Member[]> {
  return query<Member>(
    `SELECT m.id, m.user_id AS "userId", u.full_name AS "fullName", u.email, m.role, m.status
       FROM wedding_members m
       JOIN users u ON u.id = m.user_id
      WHERE m.wedding_id = $1
      ORDER BY m.created_at`,
    [weddingId],
  );
}

/**
 * MVP collaboration: add a member by the email of an existing account.
 * Email invitations to people without accounts are a later slice (they need
 * outbound email infrastructure, not new schema).
 */
export async function addMemberByEmail(
  weddingId: string,
  email: string,
  role: Exclude<WeddingRole, 'owner'>,
  invitedBy: string,
): Promise<Member> {
  const users = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  const user = users[0];
  if (!user) {
    throw new HttpError(404, 'No account exists with that email — ask them to register first');
  }

  try {
    await query(
      `INSERT INTO wedding_members (wedding_id, user_id, role, status, invited_by)
       VALUES ($1, $2, $3, 'active', $4)`,
      [weddingId, user.id, role, invitedBy],
    );
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      throw new HttpError(409, 'That person is already a member of this wedding');
    }
    throw err;
  }

  const members = await listMembers(weddingId);
  return members.find((m) => m.userId === user.id)!;
}
