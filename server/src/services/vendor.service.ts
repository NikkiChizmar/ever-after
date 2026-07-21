import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export type VendorCategory =
  | 'venue' | 'catering' | 'photography' | 'videography' | 'florist' | 'music'
  | 'attire' | 'beauty' | 'transport' | 'stationery' | 'rentals' | 'officiant' | 'other';

export type VendorStatus = 'researching' | 'contacted' | 'quote_received' | 'booked' | 'declined';

export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  budgetCategoryId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  estimatedCost: string | null;
  notes: string | null;
  createdAt: string;
}

const VENDOR_COLUMNS = `
  id, wedding_id AS "weddingId", name, category, status,
  budget_category_id AS "budgetCategoryId",
  contact_name AS "contactName", email, phone, website,
  estimated_cost AS "estimatedCost", notes,
  created_at AS "createdAt"
`;

export async function listVendors(weddingId: string): Promise<Vendor[]> {
  return query<Vendor>(
    `SELECT ${VENDOR_COLUMNS} FROM vendors WHERE wedding_id = $1 ORDER BY created_at`,
    [weddingId],
  );
}

interface CreateVendorInput {
  name: string;
  category: VendorCategory;
  status?: VendorStatus;
  budgetCategoryId?: string | null;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  estimatedCost?: number;
  notes?: string;
}

export async function createVendor(weddingId: string, input: CreateVendorInput): Promise<Vendor> {
  const rows = await query<Vendor>(
    `INSERT INTO vendors (
       wedding_id, name, category, status, budget_category_id,
       contact_name, email, phone, website, estimated_cost, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${VENDOR_COLUMNS}`,
    [
      weddingId,
      input.name,
      input.category,
      input.status ?? 'researching',
      input.budgetCategoryId ?? null,
      input.contactName ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.website ?? null,
      input.estimatedCost ?? null,
      input.notes ?? null,
    ],
  );
  return rows[0]!;
}

export async function getVendor(weddingId: string, vendorId: string): Promise<Vendor> {
  const rows = await query<Vendor>(
    `SELECT ${VENDOR_COLUMNS} FROM vendors WHERE id = $1 AND wedding_id = $2`,
    [vendorId, weddingId],
  );
  const vendor = rows[0];
  if (!vendor) {
    throw new HttpError(404, 'Vendor not found');
  }
  return vendor;
}

interface UpdateVendorInput {
  name?: string;
  category?: VendorCategory;
  status?: VendorStatus;
  budgetCategoryId?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  estimatedCost?: number | null;
  notes?: string | null;
}

export async function updateVendor(
  weddingId: string,
  vendorId: string,
  input: UpdateVendorInput,
): Promise<Vendor> {
  await getVendor(weddingId, vendorId); // 404s if missing/wrong wedding

  const columnFor: Record<string, string> = {
    name: 'name',
    category: 'category',
    status: 'status',
    budgetCategoryId: 'budget_category_id',
    contactName: 'contact_name',
    email: 'email',
    phone: 'phone',
    website: 'website',
    estimatedCost: 'estimated_cost',
    notes: 'notes',
  };
  const sets: string[] = [];
  const params: unknown[] = [vendorId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateVendorInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getVendor(weddingId, vendorId);
  }

  const rows = await query<Vendor>(
    `UPDATE vendors SET ${sets.join(', ')} WHERE id = $1 RETURNING ${VENDOR_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteVendor(weddingId: string, vendorId: string): Promise<void> {
  await getVendor(weddingId, vendorId);
  // Contracts (and their payments) cascade — deleting a vendor deletes its
  // money history too. The route confirms this destructively on the client.
  await query('DELETE FROM vendors WHERE id = $1', [vendorId]);
}
