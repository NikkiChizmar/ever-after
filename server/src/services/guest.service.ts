import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export type AgeType = 'adult' | 'child' | 'infant';
export type DietaryTag =
  | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'nut_allergy'
  | 'shellfish_allergy' | 'kosher' | 'halal' | 'other';

export interface Guest {
  id: string;
  weddingId: string;
  partyId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  ageType: AgeType;
  isPlusOne: boolean;
  plusOneOf: string | null;
  dietaryNotes: string | null;
  notes: string | null;
  dietaryTags: DietaryTag[];
}

const GUEST_COLUMNS = `
  g.id, g.wedding_id AS "weddingId", g.party_id AS "partyId",
  g.first_name AS "firstName", g.last_name AS "lastName",
  g.email, g.phone, g.age_type AS "ageType",
  g.is_plus_one AS "isPlusOne", g.plus_one_of AS "plusOneOf",
  g.dietary_notes AS "dietaryNotes", g.notes
`;

/**
 * Dietary tags are fetched separately and merged in JS rather than joined —
 * a LEFT JOIN here would fan-out one guest row per tag, the same trap the
 * budget rollups avoid (see budget.service.ts). One extra query is simpler
 * than de-duplicating fanned-out rows.
 */
async function attachDietaryTags(guests: Omit<Guest, 'dietaryTags'>[]): Promise<Guest[]> {
  if (guests.length === 0) return [];
  const tagRows = await query<{ guestId: string; tag: DietaryTag }>(
    `SELECT guest_id AS "guestId", tag FROM guest_dietary_tags WHERE guest_id = ANY($1)`,
    [guests.map((g) => g.id)],
  );
  const tagsByGuest = new Map<string, DietaryTag[]>();
  for (const row of tagRows) {
    tagsByGuest.set(row.guestId, [...(tagsByGuest.get(row.guestId) ?? []), row.tag]);
  }
  return guests.map((g) => ({ ...g, dietaryTags: tagsByGuest.get(g.id) ?? [] }));
}

export async function listGuests(weddingId: string): Promise<Guest[]> {
  const guests = await query<Omit<Guest, 'dietaryTags'>>(
    `SELECT ${GUEST_COLUMNS} FROM guests g WHERE g.wedding_id = $1 ORDER BY g.last_name, g.first_name`,
    [weddingId],
  );
  return attachDietaryTags(guests);
}

export async function getGuest(weddingId: string, guestId: string): Promise<Guest> {
  const rows = await query<Omit<Guest, 'dietaryTags'>>(
    `SELECT ${GUEST_COLUMNS} FROM guests g WHERE g.id = $1 AND g.wedding_id = $2`,
    [guestId, weddingId],
  );
  const guest = rows[0];
  if (!guest) {
    throw new HttpError(404, 'Guest not found');
  }
  return (await attachDietaryTags([guest]))[0]!;
}

interface CreateGuestInput {
  partyId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  ageType?: AgeType;
  plusOneOf?: string;
  dietaryNotes?: string;
  notes?: string;
}

export async function createGuest(weddingId: string, input: CreateGuestInput): Promise<Guest> {
  let partyId = input.partyId;
  let isPlusOne = false;

  if (input.plusOneOf) {
    // A plus-one has no identity independent of the person who brought
    // them — they belong to the same party regardless of what (if
    // anything) the caller passed as partyId. See docs/data-model.md §2.5.
    const host = await getGuest(weddingId, input.plusOneOf);
    partyId = host.partyId;
    isPlusOne = true;
  }

  if (!partyId) {
    throw new HttpError(400, 'partyId is required unless plusOneOf is provided');
  }

  const partyCheck = await query('SELECT 1 FROM parties WHERE id = $1 AND wedding_id = $2', [
    partyId,
    weddingId,
  ]);
  if (partyCheck.length === 0) {
    throw new HttpError(404, 'Party not found');
  }

  const rows = await query<Omit<Guest, 'dietaryTags'>>(
    `INSERT INTO guests (
       wedding_id, party_id, first_name, last_name, email, phone,
       age_type, is_plus_one, plus_one_of, dietary_notes, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${GUEST_COLUMNS.replaceAll('g.', '')}`,
    [
      weddingId,
      partyId,
      input.firstName ?? null,
      input.lastName ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.ageType ?? 'adult',
      isPlusOne,
      input.plusOneOf ?? null,
      input.dietaryNotes ?? null,
      input.notes ?? null,
    ],
  );
  return { ...rows[0]!, dietaryTags: [] };
}

interface UpdateGuestInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  ageType?: AgeType;
  dietaryNotes?: string | null;
  notes?: string | null;
}

export async function updateGuest(weddingId: string, guestId: string, input: UpdateGuestInput): Promise<Guest> {
  await getGuest(weddingId, guestId);

  const columnFor: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    ageType: 'age_type',
    dietaryNotes: 'dietary_notes',
    notes: 'notes',
  };
  const sets: string[] = [];
  const params: unknown[] = [guestId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateGuestInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length > 0) {
    await query(`UPDATE guests SET ${sets.join(', ')} WHERE id = $1`, params);
  }
  return getGuest(weddingId, guestId);
}

export async function deleteGuest(weddingId: string, guestId: string): Promise<void> {
  await getGuest(weddingId, guestId);
  // Their plus-one (if any) and all event invitations cascade too.
  await query('DELETE FROM guests WHERE id = $1', [guestId]);
}

export async function addDietaryTag(weddingId: string, guestId: string, tag: DietaryTag): Promise<void> {
  await getGuest(weddingId, guestId);
  try {
    await query('INSERT INTO guest_dietary_tags (guest_id, tag) VALUES ($1, $2)', [guestId, tag]);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      return; // already tagged — treat as success, not an error
    }
    throw err;
  }
}

export async function removeDietaryTag(weddingId: string, guestId: string, tag: DietaryTag): Promise<void> {
  await getGuest(weddingId, guestId);
  await query('DELETE FROM guest_dietary_tags WHERE guest_id = $1 AND tag = $2', [guestId, tag]);
}
