import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';
import { getEvent } from './event.service.js';

export interface MealOption {
  id: string;
  weddingId: string;
  eventId: string;
  name: string;
  description: string | null;
  isKidsMeal: boolean;
  sortOrder: number;
}

const MEAL_COLUMNS = `
  id, wedding_id AS "weddingId", event_id AS "eventId", name,
  description, is_kids_meal AS "isKidsMeal", sort_order AS "sortOrder"
`;

export async function listMealOptions(weddingId: string, eventId: string): Promise<MealOption[]> {
  return query<MealOption>(
    `SELECT ${MEAL_COLUMNS} FROM meal_options
      WHERE wedding_id = $1 AND event_id = $2 ORDER BY sort_order, created_at`,
    [weddingId, eventId],
  );
}

interface CreateMealOptionInput {
  name: string;
  description?: string;
  isKidsMeal?: boolean;
  sortOrder?: number;
}

export async function createMealOption(
  weddingId: string,
  eventId: string,
  input: CreateMealOptionInput,
): Promise<MealOption> {
  await getEvent(weddingId, eventId); // confirms the event belongs to this wedding

  const rows = await query<MealOption>(
    `INSERT INTO meal_options (wedding_id, event_id, name, description, is_kids_meal, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${MEAL_COLUMNS}`,
    [weddingId, eventId, input.name, input.description ?? null, input.isKidsMeal ?? false, input.sortOrder ?? 0],
  );
  return rows[0]!;
}

async function assertMealOptionInWedding(weddingId: string, mealOptionId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM meal_options WHERE id = $1 AND wedding_id = $2', [
    mealOptionId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Meal option not found');
  }
}

interface UpdateMealOptionInput {
  name?: string;
  description?: string | null;
  isKidsMeal?: boolean;
  sortOrder?: number;
}

export async function updateMealOption(
  weddingId: string,
  mealOptionId: string,
  input: UpdateMealOptionInput,
): Promise<MealOption> {
  await assertMealOptionInWedding(weddingId, mealOptionId);

  const columnFor: Record<string, string> = {
    name: 'name',
    description: 'description',
    isKidsMeal: 'is_kids_meal',
    sortOrder: 'sort_order',
  };
  const sets: string[] = [];
  const params: unknown[] = [mealOptionId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateMealOptionInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    const rows = await query<MealOption>(`SELECT ${MEAL_COLUMNS} FROM meal_options WHERE id = $1`, [
      mealOptionId,
    ]);
    return rows[0]!;
  }

  const rows = await query<MealOption>(
    `UPDATE meal_options SET ${sets.join(', ')} WHERE id = $1 RETURNING ${MEAL_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteMealOption(weddingId: string, mealOptionId: string): Promise<void> {
  await assertMealOptionInWedding(weddingId, mealOptionId);
  // Any invitation that had selected this meal falls back to no selection —
  // the composite FK is ON DELETE SET NULL (see migration).
  await query('DELETE FROM meal_options WHERE id = $1', [mealOptionId]);
}
