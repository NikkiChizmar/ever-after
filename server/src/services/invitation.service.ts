import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';
import type { AgeType } from './guest.service.js';

export type RsvpStatus = 'pending' | 'attending' | 'declined';

export interface EventInvitation {
  id: string;
  weddingId: string;
  guestId: string;
  eventId: string;
  rsvpStatus: RsvpStatus;
  respondedAt: string | null;
  mealOptionId: string | null;
  notes: string | null;
}

/** The roster shape: an invitation plus enough guest/party context to render
 * a "who's coming to the ceremony" table without a second round trip. */
export interface RosterEntry extends EventInvitation {
  guestFirstName: string | null;
  guestLastName: string | null;
  ageType: AgeType;
  partyName: string;
  mealOptionName: string | null;
}

const INVITATION_COLUMNS = `
  ei.id, ei.wedding_id AS "weddingId", ei.guest_id AS "guestId", ei.event_id AS "eventId",
  ei.rsvp_status AS "rsvpStatus", ei.responded_at AS "respondedAt",
  ei.meal_option_id AS "mealOptionId", ei.notes
`;

export async function listRosterForEvent(weddingId: string, eventId: string): Promise<RosterEntry[]> {
  return query<RosterEntry>(
    `SELECT ${INVITATION_COLUMNS},
            g.first_name AS "guestFirstName", g.last_name AS "guestLastName", g.age_type AS "ageType",
            p.name AS "partyName", mo.name AS "mealOptionName"
       FROM event_invitations ei
       JOIN guests g ON g.id = ei.guest_id
       JOIN parties p ON p.id = g.party_id
       LEFT JOIN meal_options mo ON mo.id = ei.meal_option_id
      WHERE ei.wedding_id = $1 AND ei.event_id = $2
      ORDER BY p.name, g.last_name, g.first_name`,
    [weddingId, eventId],
  );
}

export async function listInvitationsForGuest(weddingId: string, guestId: string): Promise<EventInvitation[]> {
  return query<EventInvitation>(
    `SELECT ${INVITATION_COLUMNS} FROM event_invitations ei
      WHERE ei.wedding_id = $1 AND ei.guest_id = $2`,
    [weddingId, guestId],
  );
}

async function assertBelongsToWedding(weddingId: string, table: 'events' | 'guests' | 'parties', id: string) {
  const rows = await query(`SELECT 1 FROM ${table} WHERE id = $1 AND wedding_id = $2`, [id, weddingId]);
  if (rows.length === 0) {
    throw new HttpError(404, `${table.slice(0, -1)} not found`);
  }
}

export async function inviteGuest(weddingId: string, eventId: string, guestId: string): Promise<EventInvitation> {
  await assertBelongsToWedding(weddingId, 'events', eventId);
  await assertBelongsToWedding(weddingId, 'guests', guestId);

  try {
    const rows = await query<EventInvitation>(
      `INSERT INTO event_invitations (wedding_id, guest_id, event_id)
       VALUES ($1, $2, $3)
       RETURNING ${INVITATION_COLUMNS.replaceAll('ei.', '')}`,
      [weddingId, guestId, eventId],
    );
    return rows[0]!;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      throw new HttpError(409, 'This guest is already invited to this event');
    }
    throw err;
  }
}

/**
 * "Invite the whole party" is a UI gesture that expands to one row per
 * member — see docs/data-model.md §2.8. Guests already invited are skipped
 * rather than erroring, so re-running this after adding a new party member
 * just invites the new person.
 */
export async function inviteParty(weddingId: string, eventId: string, partyId: string): Promise<EventInvitation[]> {
  await assertBelongsToWedding(weddingId, 'events', eventId);
  await assertBelongsToWedding(weddingId, 'parties', partyId);

  return query<EventInvitation>(
    `INSERT INTO event_invitations (wedding_id, guest_id, event_id)
     SELECT $1, g.id, $2 FROM guests g WHERE g.party_id = $3
     ON CONFLICT (guest_id, event_id) DO NOTHING
     RETURNING ${INVITATION_COLUMNS.replaceAll('ei.', '')}`,
    [weddingId, eventId, partyId],
  );
}

async function assertInvitationInWedding(weddingId: string, invitationId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM event_invitations WHERE id = $1 AND wedding_id = $2', [
    invitationId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Invitation not found');
  }
}

interface UpdateInvitationInput {
  rsvpStatus?: RsvpStatus;
  mealOptionId?: string | null;
  notes?: string | null;
}

export async function updateInvitation(
  weddingId: string,
  invitationId: string,
  input: UpdateInvitationInput,
): Promise<EventInvitation> {
  await assertInvitationInWedding(weddingId, invitationId);

  const sets: string[] = [];
  const params: unknown[] = [invitationId];

  if (input.rsvpStatus !== undefined) {
    params.push(input.rsvpStatus);
    sets.push(`rsvp_status = $${params.length}`);
    // Answering sets a timestamp; reverting to "pending" clears it — the
    // field always reflects the current status, not response history.
    sets.push(`responded_at = ${input.rsvpStatus === 'pending' ? 'NULL' : 'now()'}`);
  }
  if (input.mealOptionId !== undefined) {
    params.push(input.mealOptionId);
    sets.push(`meal_option_id = $${params.length}`);
  }
  if (input.notes !== undefined) {
    params.push(input.notes);
    sets.push(`notes = $${params.length}`);
  }

  if (sets.length === 0) {
    const rows = await query<EventInvitation>(
      `SELECT ${INVITATION_COLUMNS.replaceAll('ei.', '')} FROM event_invitations WHERE id = $1`,
      [invitationId],
    );
    return rows[0]!;
  }

  try {
    const rows = await query<EventInvitation>(
      `UPDATE event_invitations SET ${sets.join(', ')} WHERE id = $1
       RETURNING ${INVITATION_COLUMNS.replaceAll('ei.', '')}`,
      params,
    );
    return rows[0]!;
  } catch (err) {
    // Violates the (event_id, meal_option_id) -> meal_options(event_id, id)
    // composite FK — the caller tried to select a meal from another event's menu.
    if (err instanceof Error && 'code' in err && err.code === '23503') {
      throw new HttpError(400, "That meal option doesn't belong to this invitation's event");
    }
    throw err;
  }
}

export async function removeInvitation(weddingId: string, invitationId: string): Promise<void> {
  await assertInvitationInWedding(weddingId, invitationId);
  await query('DELETE FROM event_invitations WHERE id = $1', [invitationId]);
}
