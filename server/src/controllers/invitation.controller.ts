import type { Request, Response } from 'express';
import { z } from 'zod';

import { param } from '../lib/params.js';
import * as invitationService from '../services/invitation.service.js';

export async function listRoster(req: Request, res: Response) {
  const roster = await invitationService.listRosterForEvent(req.membership!.weddingId, param(req, 'eventId'));
  res.json({ roster });
}

export async function listInvitationsForGuest(req: Request, res: Response) {
  const invitations = await invitationService.listInvitationsForGuest(
    req.membership!.weddingId,
    param(req, 'guestId'),
  );
  res.json({ invitations });
}

const inviteGuestSchema = z.object({ guestId: z.string().uuid() });

export async function inviteGuest(req: Request, res: Response) {
  const { guestId } = inviteGuestSchema.parse(req.body);
  const invitation = await invitationService.inviteGuest(
    req.membership!.weddingId,
    param(req, 'eventId'),
    guestId,
  );
  res.status(201).json({ invitation });
}

const invitePartySchema = z.object({ partyId: z.string().uuid() });

export async function inviteParty(req: Request, res: Response) {
  const { partyId } = invitePartySchema.parse(req.body);
  const invitations = await invitationService.inviteParty(
    req.membership!.weddingId,
    param(req, 'eventId'),
    partyId,
  );
  res.status(201).json({ invitations });
}

const updateInvitationSchema = z.object({
  rsvpStatus: z.enum(['pending', 'attending', 'declined']).optional(),
  mealOptionId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function updateInvitation(req: Request, res: Response) {
  const input = updateInvitationSchema.parse(req.body);
  const invitation = await invitationService.updateInvitation(
    req.membership!.weddingId,
    param(req, 'invitationId'),
    input,
  );
  res.json({ invitation });
}

export async function removeInvitation(req: Request, res: Response) {
  await invitationService.removeInvitation(req.membership!.weddingId, param(req, 'invitationId'));
  res.status(204).end();
}
