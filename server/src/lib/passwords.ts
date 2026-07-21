import bcrypt from 'bcryptjs';

/**
 * bcrypt with cost factor 12 (~250ms per hash) — slow on purpose, so a stolen
 * database resists brute-force. Note: bcrypt silently truncates input at
 * 72 bytes, which is why the password validation schema caps length at 72.
 */
const COST_FACTOR = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A valid bcrypt hash of a random string. When login is attempted with an
 * unknown email we verify against this instead of returning early, so the
 * response time doesn't reveal whether the email exists (user enumeration).
 */
export const DUMMY_HASH = '$2a$12$Cq3lPGz3Kb8V.rN1hRQFKe1V0dY6b6h3n0kX9yqZ1qQm6mVZbfD1u';
