import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export type PartySide = 'partner1' | 'partner2' | 'both';

export interface Party {
  id: string;
  weddingId: string;
  name: string;
  mailingAddress: string | null;
  side: PartySide | null;
  notes: string | null;
}

const PARTY_COLUMNS = `
  id, wedding_id AS "weddingId", name,
  mailing_address AS "mailingAddress", side, notes
`;

export async function listParties(weddingId: string): Promise<Party[]> {
  return query<Party>(`SELECT ${PARTY_COLUMNS} FROM parties WHERE wedding_id = $1 ORDER BY name`, [
    weddingId,
  ]);
}

interface CreatePartyInput {
  name: string;
  mailingAddress?: string;
  side?: PartySide;
  notes?: string;
}

export async function createParty(weddingId: string, input: CreatePartyInput): Promise<Party> {
  const rows = await query<Party>(
    `INSERT INTO parties (wedding_id, name, mailing_address, side, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PARTY_COLUMNS}`,
    [weddingId, input.name, input.mailingAddress ?? null, input.side ?? null, input.notes ?? null],
  );
  return rows[0]!;
}

export async function getParty(weddingId: string, partyId: string): Promise<Party> {
  const rows = await query<Party>(`SELECT ${PARTY_COLUMNS} FROM parties WHERE id = $1 AND wedding_id = $2`, [
    partyId,
    weddingId,
  ]);
  const party = rows[0];
  if (!party) {
    throw new HttpError(404, 'Party not found');
  }
  return party;
}

interface UpdatePartyInput {
  name?: string;
  mailingAddress?: string | null;
  side?: PartySide | null;
  notes?: string | null;
}

export async function updateParty(weddingId: string, partyId: string, input: UpdatePartyInput): Promise<Party> {
  await getParty(weddingId, partyId);

  const columnFor: Record<string, string> = {
    name: 'name',
    mailingAddress: 'mailing_address',
    side: 'side',
    notes: 'notes',
  };
  const sets: string[] = [];
  const params: unknown[] = [partyId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdatePartyInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getParty(weddingId, partyId);
  }

  const rows = await query<Party>(
    `UPDATE parties SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PARTY_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteParty(weddingId: string, partyId: string): Promise<void> {
  await getParty(weddingId, partyId);
  // Guests in this party cascade-delete too — a party is the unit of
  // invitation, so removing it removes the people invited under it.
  await query('DELETE FROM parties WHERE id = $1', [partyId]);
}
