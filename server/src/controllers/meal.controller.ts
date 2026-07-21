import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as mealService from '../services/meal.service.js';

export async function listMealOptions(req: Request, res: Response) {
  const mealOptions = await mealService.listMealOptions(req.membership!.weddingId, uuidParam(req, 'eventId'));
  res.json({ mealOptions });
}

const createMealOptionSchema = z.object({
  name: z.string().trim().min(1, 'Meal name is required').max(120),
  description: z.string().trim().max(1000).optional(),
  isKidsMeal: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function createMealOption(req: Request, res: Response) {
  const input = createMealOptionSchema.parse(req.body);
  const mealOption = await mealService.createMealOption(
    req.membership!.weddingId,
    uuidParam(req, 'eventId'),
    input,
  );
  res.status(201).json({ mealOption });
}

const updateMealOptionSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isKidsMeal: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function updateMealOption(req: Request, res: Response) {
  const input = updateMealOptionSchema.parse(req.body);
  const mealOption = await mealService.updateMealOption(
    req.membership!.weddingId,
    uuidParam(req, 'mealOptionId'),
    input,
  );
  res.json({ mealOption });
}

export async function deleteMealOption(req: Request, res: Response) {
  await mealService.deleteMealOption(req.membership!.weddingId, uuidParam(req, 'mealOptionId'));
  res.status(204).end();
}
