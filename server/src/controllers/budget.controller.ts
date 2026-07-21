import type { Request, Response } from 'express';
import { z } from 'zod';

import * as budgetService from '../services/budget.service.js';

export async function getSummary(req: Request, res: Response) {
  const summary = await budgetService.getBudgetSummary(req.membership!.weddingId);
  res.json(summary);
}

export async function listCategories(req: Request, res: Response) {
  const categories = await budgetService.listCategories(req.membership!.weddingId);
  res.json({ categories });
}

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(120),
  plannedAmount: z.number().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
});

export async function createCategory(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);
  const category = await budgetService.createCategory(req.membership!.weddingId, input);
  res.status(201).json({ category });
}

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  plannedAmount: z.number().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
});

export async function updateCategory(req: Request, res: Response) {
  const input = updateCategorySchema.parse(req.body);
  const category = await budgetService.updateCategory(
    req.membership!.weddingId,
    req.params.categoryId!,
    input,
  );
  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response) {
  await budgetService.deleteCategory(req.membership!.weddingId, req.params.categoryId!);
  res.status(204).end();
}
