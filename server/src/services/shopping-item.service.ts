import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export interface ShoppingItem {
  id: string;
  weddingId: string;
  name: string;
  quantity: number;
  estimatedCost: string | null;
  store: string | null;
  purchased: boolean;
  createdAt: string;
}

const ITEM_COLUMNS = `
  id, wedding_id AS "weddingId", name, quantity,
  estimated_cost AS "estimatedCost", store, purchased,
  created_at AS "createdAt"
`;

export async function listItems(weddingId: string): Promise<ShoppingItem[]> {
  return query<ShoppingItem>(
    `SELECT ${ITEM_COLUMNS} FROM shopping_items
      WHERE wedding_id = $1
      ORDER BY purchased, created_at`,
    [weddingId],
  );
}

interface CreateItemInput {
  name: string;
  quantity?: number;
  estimatedCost?: number | null;
  store?: string | null;
  purchased?: boolean;
}

export async function createItem(weddingId: string, input: CreateItemInput): Promise<ShoppingItem> {
  const rows = await query<ShoppingItem>(
    `INSERT INTO shopping_items (
       wedding_id, name, quantity, estimated_cost, store, purchased
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${ITEM_COLUMNS}`,
    [
      weddingId,
      input.name,
      input.quantity ?? 1,
      input.estimatedCost ?? null,
      input.store ?? null,
      input.purchased ?? false,
    ],
  );
  return rows[0]!;
}

export async function getItem(weddingId: string, itemId: string): Promise<ShoppingItem> {
  const rows = await query<ShoppingItem>(
    `SELECT ${ITEM_COLUMNS} FROM shopping_items WHERE id = $1 AND wedding_id = $2`,
    [itemId, weddingId],
  );
  const item = rows[0];
  if (!item) {
    throw new HttpError(404, 'Item not found');
  }
  return item;
}

interface UpdateItemInput {
  name?: string;
  quantity?: number;
  estimatedCost?: number | null;
  store?: string | null;
  purchased?: boolean;
}

export async function updateItem(
  weddingId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<ShoppingItem> {
  const current = await getItem(weddingId, itemId); // 404s if missing/wrong wedding

  const columnFor: Record<string, string> = {
    name: 'name',
    quantity: 'quantity',
    estimatedCost: 'estimated_cost',
    store: 'store',
    purchased: 'purchased',
  };
  const sets: string[] = [];
  const params: unknown[] = [itemId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateItemInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return current;
  }

  const rows = await query<ShoppingItem>(
    `UPDATE shopping_items SET ${sets.join(', ')} WHERE id = $1 RETURNING ${ITEM_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteItem(weddingId: string, itemId: string): Promise<void> {
  await getItem(weddingId, itemId);
  await query('DELETE FROM shopping_items WHERE id = $1', [itemId]);
}
