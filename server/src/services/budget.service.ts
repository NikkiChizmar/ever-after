import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export interface BudgetCategory {
  id: string;
  weddingId: string;
  name: string;
  plannedAmount: string;
  sortOrder: number;
}

const CATEGORY_COLUMNS = `
  id, wedding_id AS "weddingId", name,
  planned_amount AS "plannedAmount",
  sort_order AS "sortOrder"
`;

export async function listCategories(weddingId: string): Promise<BudgetCategory[]> {
  return query<BudgetCategory>(
    `SELECT ${CATEGORY_COLUMNS} FROM budget_categories
      WHERE wedding_id = $1 ORDER BY sort_order, created_at`,
    [weddingId],
  );
}

interface CreateCategoryInput {
  name: string;
  plannedAmount?: number;
  sortOrder?: number;
}

export async function createCategory(
  weddingId: string,
  input: CreateCategoryInput,
): Promise<BudgetCategory> {
  const rows = await query<BudgetCategory>(
    `INSERT INTO budget_categories (wedding_id, name, planned_amount, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING ${CATEGORY_COLUMNS}`,
    [weddingId, input.name, input.plannedAmount ?? 0, input.sortOrder ?? 0],
  );
  return rows[0]!;
}

interface UpdateCategoryInput {
  name?: string;
  plannedAmount?: number;
  sortOrder?: number;
}

/** Verifies the category belongs to this wedding before any write — a category
 * ID from a different wedding must 404, never silently touch the wrong row. */
async function assertCategoryInWedding(weddingId: string, categoryId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM budget_categories WHERE id = $1 AND wedding_id = $2', [
    categoryId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Budget category not found');
  }
}

export async function updateCategory(
  weddingId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<BudgetCategory> {
  await assertCategoryInWedding(weddingId, categoryId);

  const columnFor: Record<string, string> = {
    name: 'name',
    plannedAmount: 'planned_amount',
    sortOrder: 'sort_order',
  };
  const sets: string[] = [];
  const params: unknown[] = [categoryId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateCategoryInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    const rows = await query<BudgetCategory>(
      `SELECT ${CATEGORY_COLUMNS} FROM budget_categories WHERE id = $1`,
      [categoryId],
    );
    return rows[0]!;
  }

  const rows = await query<BudgetCategory>(
    `UPDATE budget_categories SET ${sets.join(', ')} WHERE id = $1 RETURNING ${CATEGORY_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteCategory(weddingId: string, categoryId: string): Promise<void> {
  await assertCategoryInWedding(weddingId, categoryId);
  // Vendors in this category are not deleted — the FK is ON DELETE SET NULL,
  // so they simply become uncategorized.
  await query('DELETE FROM budget_categories WHERE id = $1', [categoryId]);
}

export interface BudgetSummary {
  categories: (BudgetCategory & { committedAmount: string; paidAmount: string })[];
  uncategorized: { committedAmount: string; paidAmount: string };
  totals: { plannedAmount: string; committedAmount: string; paidAmount: string };
}

/**
 * The Budget Center's core read. Two independent grouped queries — one over
 * contracts, one over payments — each with a single join, so neither can
 * fan-out multiply the other's total. See the migration comment on
 * payments.paid_date and docs/data-model.md §2.13 for the money model.
 */
export async function getBudgetSummary(weddingId: string): Promise<BudgetSummary> {
  const categories = await listCategories(weddingId);

  const committedRows = await query<{ budgetCategoryId: string | null; committed: string }>(
    `SELECT v.budget_category_id AS "budgetCategoryId", COALESCE(SUM(c.total_amount), 0) AS committed
       FROM vendors v
       JOIN contracts c ON c.vendor_id = v.id
      WHERE v.wedding_id = $1
      GROUP BY v.budget_category_id`,
    [weddingId],
  );

  const paidRows = await query<{ budgetCategoryId: string | null; paid: string }>(
    `SELECT v.budget_category_id AS "budgetCategoryId", COALESCE(SUM(p.amount), 0) AS paid
       FROM vendors v
       JOIN contracts c ON c.vendor_id = v.id
       JOIN payments p ON p.contract_id = c.id AND p.paid_date IS NOT NULL
      WHERE v.wedding_id = $1
      GROUP BY v.budget_category_id`,
    [weddingId],
  );

  const committedByCategory = new Map(committedRows.map((r) => [r.budgetCategoryId, r.committed]));
  const paidByCategory = new Map(paidRows.map((r) => [r.budgetCategoryId, r.paid]));

  const categoriesWithRollups = categories.map((category) => ({
    ...category,
    committedAmount: committedByCategory.get(category.id) ?? '0',
    paidAmount: paidByCategory.get(category.id) ?? '0',
  }));

  const uncategorized = {
    committedAmount: committedByCategory.get(null) ?? '0',
    paidAmount: paidByCategory.get(null) ?? '0',
  };

  const totals = {
    plannedAmount: sumDecimal(categories.map((c) => c.plannedAmount)),
    committedAmount: sumDecimal(committedRows.map((r) => r.committed)),
    paidAmount: sumDecimal(paidRows.map((r) => r.paid)),
  };

  return { categories: categoriesWithRollups, uncategorized, totals };
}

/** Sums numeric-string amounts without floating-point drift. Money is cents,
 * not floats — even a "just display it" sum should avoid 0.1 + 0.2 territory. */
function sumDecimal(amounts: string[]): string {
  const cents = amounts.reduce((total, amount) => total + Math.round(Number(amount) * 100), 0);
  return (cents / 100).toFixed(2);
}
