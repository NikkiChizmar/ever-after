import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as eventService from '../services/event.service.js';

export async function listEvents(req: Request, res: Response) {
  const events = await eventService.listEvents(req.membership!.weddingId);
  res.json({ events });
}

const createEventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required').max(120),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  venueName: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  attire: z.string().trim().max(120).optional(),
  notes: z.string().max(4000).optional(),
  sortOrder: z.number().int().optional(),
});

export async function createEvent(req: Request, res: Response) {
  const input = createEventSchema.parse(req.body);
  const event = await eventService.createEvent(req.membership!.weddingId, input);
  res.status(201).json({ event });
}

const updateEventSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  venueName: z.string().trim().max(200).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  attire: z.string().trim().max(120).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export async function updateEvent(req: Request, res: Response) {
  const input = updateEventSchema.parse(req.body);
  const event = await eventService.updateEvent(req.membership!.weddingId, uuidParam(req, 'eventId'), input);
  res.json({ event });
}

export async function deleteEvent(req: Request, res: Response) {
  await eventService.deleteEvent(req.membership!.weddingId, uuidParam(req, 'eventId'));
  res.status(204).end();
}
