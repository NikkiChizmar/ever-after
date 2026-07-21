import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';
import { getVendor } from './vendor.service.js';

export interface Contract {
  id: string;
  weddingId: string;
  vendorId: string;
  title: string | null;
  totalAmount: string;
  signedOn: string | null;
  notes: string | null;
}

const CONTRACT_COLUMNS = `
  id, wedding_id AS "weddingId", vendor_id AS "vendorId", title,
  total_amount AS "totalAmount", signed_on AS "signedOn", notes
`;

export async function listContractsForVendor(weddingId: string, vendorId: string): Promise<Contract[]> {
  return query<Contract>(
    `SELECT ${CONTRACT_COLUMNS} FROM contracts
      WHERE wedding_id = $1 AND vendor_id = $2 ORDER BY created_at`,
    [weddingId, vendorId],
  );
}

interface CreateContractInput {
  title?: string;
  totalAmount: number;
  signedOn?: string;
  notes?: string;
}

export async function createContract(
  weddingId: string,
  vendorId: string,
  input: CreateContractInput,
): Promise<Contract> {
  await getVendor(weddingId, vendorId); // confirms the vendor belongs to this wedding

  const rows = await query<Contract>(
    `INSERT INTO contracts (wedding_id, vendor_id, title, total_amount, signed_on, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${CONTRACT_COLUMNS}`,
    [weddingId, vendorId, input.title ?? null, input.totalAmount, input.signedOn ?? null, input.notes ?? null],
  );
  return rows[0]!;
}

async function assertContractInWedding(weddingId: string, contractId: string): Promise<void> {
  const rows = await query('SELECT 1 FROM contracts WHERE id = $1 AND wedding_id = $2', [
    contractId,
    weddingId,
  ]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Contract not found');
  }
}

interface UpdateContractInput {
  title?: string | null;
  totalAmount?: number;
  signedOn?: string | null;
  notes?: string | null;
}

export async function updateContract(
  weddingId: string,
  contractId: string,
  input: UpdateContractInput,
): Promise<Contract> {
  await assertContractInWedding(weddingId, contractId);

  const columnFor: Record<string, string> = {
    title: 'title',
    totalAmount: 'total_amount',
    signedOn: 'signed_on',
    notes: 'notes',
  };
  const sets: string[] = [];
  const params: unknown[] = [contractId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateContractInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    const rows = await query<Contract>(`SELECT ${CONTRACT_COLUMNS} FROM contracts WHERE id = $1`, [
      contractId,
    ]);
    return rows[0]!;
  }

  const rows = await query<Contract>(
    `UPDATE contracts SET ${sets.join(', ')} WHERE id = $1 RETURNING ${CONTRACT_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteContract(weddingId: string, contractId: string): Promise<void> {
  await assertContractInWedding(weddingId, contractId);
  await query('DELETE FROM contracts WHERE id = $1', [contractId]); // payments cascade
}
