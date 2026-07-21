import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as partyService from '../services/party.service.js';

const partySide = z.enum(['partner1', 'partner2', 'both']);

export async function listParties(req: Request, res: Response) {
  const parties = await partyService.listParties(req.membership!.weddingId);
  res.json({ parties });
}

const createPartySchema = z.object({
  name: z.string().trim().min(1, 'Party name is required').max(200),
  mailingAddress: z.string().trim().max(500).optional(),
  side: partySide.optional(),
  notes: z.string().max(4000).optional(),
});

export async function createParty(req: Request, res: Response) {
  const input = createPartySchema.parse(req.body);
  const party = await partyService.createParty(req.membership!.weddingId, input);
  res.status(201).json({ party });
}

const updatePartySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  mailingAddress: z.string().trim().max(500).nullable().optional(),
  side: partySide.nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateParty(req: Request, res: Response) {
  const input = updatePartySchema.parse(req.body);
  const party = await partyService.updateParty(req.membership!.weddingId, uuidParam(req, 'partyId'), input);
  res.json({ party });
}

export async function deleteParty(req: Request, res: Response) {
  await partyService.deleteParty(req.membership!.weddingId, uuidParam(req, 'partyId'));
  res.status(204).end();
}
