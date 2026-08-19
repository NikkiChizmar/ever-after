import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as shoppingItemService from '../services/shopping-item.service.js';

export async function listItems(req: Request, res: Response) {
  const items = await shoppingItemService.listItems(req.membership!.weddingId);
  res.json({ items });
}

const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(200),
  quantity: z.number().int().min(1).max(9999).optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  store: z.string().trim().max(200).nullable().optional(),
  purchased: z.boolean().optional(),
});

export async function createItem(req: Request, res: Response) {
  const input = createItemSchema.parse(req.body);
  const item = await shoppingItemService.createItem(req.membership!.weddingId, input);
  res.status(201).json({ item });
}

export async function getItem(req: Request, res: Response) {
  const item = await shoppingItemService.getItem(req.membership!.weddingId, uuidParam(req, 'itemId'));
  res.json({ item });
}

const updateItemSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  quantity: z.number().int().min(1).max(9999).optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  store: z.string().trim().max(200).nullable().optional(),
  purchased: z.boolean().optional(),
});

export async function updateItem(req: Request, res: Response) {
  const input = updateItemSchema.parse(req.body);
  const item = await shoppingItemService.updateItem(
    req.membership!.weddingId,
    uuidParam(req, 'itemId'),
    input,
  );
  res.json({ item });
}

export async function deleteItem(req: Request, res: Response) {
  await shoppingItemService.deleteItem(req.membership!.weddingId, uuidParam(req, 'itemId'));
  res.status(204).end();
}
