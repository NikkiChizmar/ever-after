import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export interface Event {
  id: string;
  weddingId: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  venueName: string | null;
  address: string | null;
  attire: string | null;
  notes: string | null;
  sortOrder: number;
}

const EVENT_COLUMNS = `
  id, wedding_id AS "weddingId", name,
  starts_at AS "startsAt", ends_at AS "endsAt",
  venue_name AS "venueName", address, attire, notes,
  sort_order AS "sortOrder"
`;

export async function listEvents(weddingId: string): Promise<Event[]> {
  return query<Event>(
    `SELECT ${EVENT_COLUMNS} FROM events WHERE wedding_id = $1 ORDER BY sort_order, starts_at NULLS LAST, created_at`,
    [weddingId],
  );
}

interface CreateEventInput {
  name: string;
  startsAt?: string;
  endsAt?: string;
  venueName?: string;
  address?: string;
  attire?: string;
  notes?: string;
  sortOrder?: number;
}

export async function createEvent(weddingId: string, input: CreateEventInput): Promise<Event> {
  const rows = await query<Event>(
    `INSERT INTO events (wedding_id, name, starts_at, ends_at, venue_name, address, attire, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${EVENT_COLUMNS}`,
    [
      weddingId,
      input.name,
      input.startsAt ?? null,
      input.endsAt ?? null,
      input.venueName ?? null,
      input.address ?? null,
      input.attire ?? null,
      input.notes ?? null,
      input.sortOrder ?? 0,
    ],
  );
  return rows[0]!;
}

export async function getEvent(weddingId: string, eventId: string): Promise<Event> {
  const rows = await query<Event>(`SELECT ${EVENT_COLUMNS} FROM events WHERE id = $1 AND wedding_id = $2`, [
    eventId,
    weddingId,
  ]);
  const event = rows[0];
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }
  return event;
}

interface UpdateEventInput {
  name?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  venueName?: string | null;
  address?: string | null;
  attire?: string | null;
  notes?: string | null;
  sortOrder?: number;
}

export async function updateEvent(weddingId: string, eventId: string, input: UpdateEventInput): Promise<Event> {
  await getEvent(weddingId, eventId);

  const columnFor: Record<string, string> = {
    name: 'name',
    startsAt: 'starts_at',
    endsAt: 'ends_at',
    venueName: 'venue_name',
    address: 'address',
    attire: 'attire',
    notes: 'notes',
    sortOrder: 'sort_order',
  };
  const sets: string[] = [];
  const params: unknown[] = [eventId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateEventInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getEvent(weddingId, eventId);
  }

  const rows = await query<Event>(
    `UPDATE events SET ${sets.join(', ')} WHERE id = $1 RETURNING ${EVENT_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteEvent(weddingId: string, eventId: string): Promise<void> {
  await getEvent(weddingId, eventId);
  // Invitations and meal options for this event cascade too.
  await query('DELETE FROM events WHERE id = $1', [eventId]);
}
