import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../lib/passwords.js';
import { createSession, type AuthUser } from '../lib/sessions.js';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export async function registerUser(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
  const passwordHash = await hashPassword(input.password);

  let rows: AuthUser[];
  try {
    rows = await query<AuthUser>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name AS "fullName"`,
      [input.email, passwordHash, input.fullName],
    );
  } catch (err) {
    // 23505 = unique_violation. Let the DB enforce uniqueness (a pre-check
    // SELECT would race), and translate its verdict into a friendly 409.
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      throw new HttpError(409, 'An account with that email already exists');
    }
    throw err;
  }

  const user = rows[0]!;
  const { token } = await createSession(user.id);
  return { user, token };
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const rows = await query<AuthUser & { passwordHash: string }>(
    `SELECT id, email, full_name AS "fullName", password_hash AS "passwordHash"
       FROM users WHERE email = $1`,
    [email],
  );
  const found = rows[0];

  // Same code path and similar timing whether or not the email exists,
  // and one generic message either way — no user enumeration.
  const valid = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !valid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const { token } = await createSession(found.id);
  return { user: { id: found.id, email: found.email, fullName: found.fullName }, token };
}
