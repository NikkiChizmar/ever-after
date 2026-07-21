import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export type PaymentMethod = 'card' | 'check' | 'transfer' | 'cash' | 'other';

export interface Payment {
  id: string;
  weddingId: string;
  contractId: string;
  label: string;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  method: PaymentMethod | null;
  notes: string | null;
}

const PAYMENT_COLUMNS = `
  id, wedding_id AS "weddingId", contract_id AS "contractId", label, amount,
  due_date AS "dueDate", paid_date AS "paidDate", method, notes
`;

async function assertContractInWedding(weddingId: string, contractId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM contracts WHERE id = $1 AND wedding_id = $2', [
    contractId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Contract not found');
  }
}

export async function listPaymentsForContract(weddingId: string, contractId: string): Promise<Payment[]> {
  return query<Payment>(
    `SELECT ${PAYMENT_COLUMNS} FROM payments
      WHERE wedding_id = $1 AND contract_id = $2
      ORDER BY due_date NULLS LAST, created_at`,
    [weddingId, contractId],
  );
}

interface CreatePaymentInput {
  label: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  method?: PaymentMethod;
  notes?: string;
}

export async function createPayment(
  weddingId: string,
  contractId: string,
  input: CreatePaymentInput,
): Promise<Payment> {
  await assertContractInWedding(weddingId, contractId);

  const rows = await query<Payment>(
    `INSERT INTO payments (wedding_id, contract_id, label, amount, due_date, paid_date, method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PAYMENT_COLUMNS}`,
    [
      weddingId,
      contractId,
      input.label,
      input.amount,
      input.dueDate ?? null,
      input.paidDate ?? null,
      input.method ?? null,
      input.notes ?? null,
    ],
  );
  return rows[0]!;
}

async function assertPaymentInWedding(weddingId: string, paymentId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM payments WHERE id = $1 AND wedding_id = $2', [
    paymentId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Payment not found');
  }
}

interface UpdatePaymentInput {
  label?: string;
  amount?: number;
  dueDate?: string | null;
  paidDate?: string | null; // set this to record "paid"; null to revert to scheduled
  method?: PaymentMethod | null;
  notes?: string | null;
}

export async function updatePayment(
  weddingId: string,
  paymentId: string,
  input: UpdatePaymentInput,
): Promise<Payment> {
  await assertPaymentInWedding(weddingId, paymentId);

  const columnFor: Record<string, string> = {
    label: 'label',
    amount: 'amount',
    dueDate: 'due_date',
    paidDate: 'paid_date',
    method: 'method',
    notes: 'notes',
  };
  const sets: string[] = [];
  const params: unknown[] = [paymentId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdatePaymentInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    const rows = await query<Payment>(`SELECT ${PAYMENT_COLUMNS} FROM payments WHERE id = $1`, [
      paymentId,
    ]);
    return rows[0]!;
  }

  const rows = await query<Payment>(
    `UPDATE payments SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PAYMENT_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deletePayment(weddingId: string, paymentId: string): Promise<void> {
  await assertPaymentInWedding(weddingId, paymentId);
  await query('DELETE FROM payments WHERE id = $1', [paymentId]);
}
