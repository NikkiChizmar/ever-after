import type { Request, Response } from 'express';
import { z } from 'zod';

import * as weddingService from '../services/wedding.service.js';

const createWeddingSchema = z.object({
  name: z.string().trim().min(1, 'Wedding name is required').max(120),
  weddingDate: z.string().date().optional(), // YYYY-MM-DD
  currency: z.string().length(3).toUpperCase().optional(),
  totalBudget: z.number().nonnegative().optional(),
});

export async function createWedding(req: Request, res: Response) {
  const input = createWeddingSchema.parse(req.body);
  const wedding = await weddingService.createWedding(req.user!.id, input);
  res.status(201).json({ wedding });
}

export async function listMyWeddings(req: Request, res: Response) {
  const weddings = await weddingService.listWeddingsForUser(req.user!.id);
  res.json({ weddings });
}

export async function getWedding(req: Request, res: Response) {
  const wedding = await weddingService.getWedding(req.membership!.weddingId);
  res.json({ wedding, role: req.membership!.role });
}

const updateWeddingSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  weddingDate: z.string().date().nullable().optional(), // null clears the date
  currency: z.string().length(3).toUpperCase().optional(),
  totalBudget: z.number().nonnegative().nullable().optional(),
});

export async function updateWedding(req: Request, res: Response) {
  const input = updateWeddingSchema.parse(req.body);
  const wedding = await weddingService.updateWedding(req.membership!.weddingId, input);
  res.json({ wedding });
}

export async function listMembers(req: Request, res: Response) {
  const members = await weddingService.listMembers(req.membership!.weddingId);
  res.json({ members });
}

const addMemberSchema = z.object({
  email: z.string().email(),
  // Owners are created only by creating a wedding; ownership transfer is a
  // deliberate future feature, not an accidental capability.
  role: z.enum(['editor', 'viewer']),
});

export async function addMember(req: Request, res: Response) {
  const input = addMemberSchema.parse(req.body);
  const member = await weddingService.addMemberByEmail(
    req.membership!.weddingId,
    input.email,
    input.role,
    req.user!.id,
  );
  res.status(201).json({ member });
}
