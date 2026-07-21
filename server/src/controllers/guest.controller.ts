import type { Request, Response } from 'express';
import { z } from 'zod';

import { param } from '../lib/params.js';
import * as guestService from '../services/guest.service.js';

const ageType = z.enum(['adult', 'child', 'infant']);
const dietaryTag = z.enum([
  'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy',
  'shellfish_allergy', 'kosher', 'halal', 'other',
]);

export async function listGuests(req: Request, res: Response) {
  const guests = await guestService.listGuests(req.membership!.weddingId);
  res.json({ guests });
}

const createGuestSchema = z
  .object({
    partyId: z.string().uuid().optional(),
    firstName: z.string().trim().max(120).optional(),
    lastName: z.string().trim().max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().trim().max(40).optional(),
    ageType: ageType.optional(),
    // Set this to create an unnamed (or named) plus-one — see guest.service.ts.
    plusOneOf: z.string().uuid().optional(),
    dietaryNotes: z.string().max(2000).optional(),
    notes: z.string().max(4000).optional(),
  })
  .refine((data) => data.partyId ?? data.plusOneOf, {
    message: 'Either partyId or plusOneOf is required',
  });

export async function createGuest(req: Request, res: Response) {
  const input = createGuestSchema.parse(req.body);
  const guest = await guestService.createGuest(req.membership!.weddingId, input);
  res.status(201).json({ guest });
}

export async function getGuest(req: Request, res: Response) {
  const guest = await guestService.getGuest(req.membership!.weddingId, param(req, 'guestId'));
  res.json({ guest });
}

const updateGuestSchema = z.object({
  firstName: z.string().trim().max(120).nullable().optional(),
  lastName: z.string().trim().max(120).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  ageType: ageType.optional(),
  dietaryNotes: z.string().max(2000).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateGuest(req: Request, res: Response) {
  const input = updateGuestSchema.parse(req.body);
  const guest = await guestService.updateGuest(req.membership!.weddingId, param(req, 'guestId'), input);
  res.json({ guest });
}

export async function deleteGuest(req: Request, res: Response) {
  await guestService.deleteGuest(req.membership!.weddingId, param(req, 'guestId'));
  res.status(204).end();
}

export async function addDietaryTag(req: Request, res: Response) {
  const { tag } = z.object({ tag: dietaryTag }).parse(req.body);
  await guestService.addDietaryTag(req.membership!.weddingId, param(req, 'guestId'), tag);
  res.status(204).end();
}

export async function removeDietaryTag(req: Request, res: Response) {
  const tag = dietaryTag.parse(req.params.tag);
  await guestService.removeDietaryTag(req.membership!.weddingId, param(req, 'guestId'), tag);
  res.status(204).end();
}
