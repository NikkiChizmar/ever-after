import { readFileSync } from 'node:fs';
import path from 'node:path';

import { pool, query } from '../src/db/pool.js';
import * as budgetService from '../src/services/budget.service.js';
import * as vendorService from '../src/services/vendor.service.js';
import * as contractService from '../src/services/contract.service.js';
import * as paymentService from '../src/services/payment.service.js';
import type { VendorCategory, VendorStatus } from '../src/services/vendor.service.js';
import type { PaymentMethod } from '../src/services/payment.service.js';

/**
 * One-time bulk import for vendor research done outside the app (a
 * spreadsheet, a shared doc, whatever people actually use while shopping
 * for vendors). Point it at a JSON file shaped like scripts/data/vendors.
 * example.json and it creates budget categories, vendors, and — for
 * anything already booked — the contract and payment records too.
 *
 * Goes through the same service functions the HTTP API uses, so every
 * business rule (vendor-belongs-to-wedding checks, etc.) applies here too.
 * It's a script, not a shortcut around the domain layer.
 *
 * Safe to re-run: categories and vendors are matched by name before being
 * created, and a vendor that already has a contract is left alone.
 *
 * Usage:
 *   npm run import:vendors -w server -- <path-to-data.json> [weddingId]
 *
 * If weddingId is omitted, the script uses it automatically when the
 * database has exactly one wedding — the common case in local dev.
 */

interface ImportPayment {
  label: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  method?: PaymentMethod;
  notes?: string;
}

interface ImportContract {
  title?: string;
  totalAmount: number;
  signedOn?: string;
  notes?: string;
  payments?: ImportPayment[];
}

interface ImportVendor {
  name: string;
  category: VendorCategory;
  budgetCategory?: string;
  status?: VendorStatus;
  estimatedCost?: number;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  contract?: ImportContract;
}

interface ImportData {
  budgetCategories: { name: string; plannedAmount?: number }[];
  vendors: ImportVendor[];
}

async function resolveWeddingId(explicit: string | undefined): Promise<string> {
  if (explicit) return explicit;

  const weddings = await query<{ id: string; name: string }>('SELECT id, name FROM weddings');
  if (weddings.length === 1) {
    console.log(`No weddingId given — using the only wedding found: "${weddings[0]!.name}".`);
    return weddings[0]!.id;
  }
  if (weddings.length === 0) {
    throw new Error('No weddings exist in this database yet. Create one first.');
  }
  throw new Error(
    `Multiple weddings found — pass one explicitly:\n` +
      weddings.map((w) => `  ${w.id}  ${w.name}`).join('\n'),
  );
}

async function main() {
  const dataPathArg = process.argv[2] ?? 'scripts/data/vendors.json';
  const weddingIdArg = process.argv[3];

  const dataPath = path.resolve(process.cwd(), dataPathArg);
  const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as ImportData;

  const weddingId = await resolveWeddingId(weddingIdArg);

  let categoriesCreated = 0;
  let vendorsCreated = 0;
  let vendorsSkipped = 0;
  let contractsCreated = 0;
  let paymentsCreated = 0;

  const existingCategories = await budgetService.listCategories(weddingId);
  const categoryIdByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const cat of data.budgetCategories) {
    if (categoryIdByName.has(cat.name.toLowerCase())) continue;
    const created = await budgetService.createCategory(weddingId, {
      name: cat.name,
      plannedAmount: cat.plannedAmount ?? 0,
    });
    categoryIdByName.set(cat.name.toLowerCase(), created.id);
    categoriesCreated++;
  }

  const existingVendors = await vendorService.listVendors(weddingId);
  const vendorKey = (name: string, category: string) => `${name.toLowerCase()}::${category}`;
  const vendorIdByKey = new Map(existingVendors.map((v) => [vendorKey(v.name, v.category), v.id]));

  for (const v of data.vendors) {
    const key = vendorKey(v.name, v.category);
    let vendorId = vendorIdByKey.get(key);

    if (!vendorId) {
      const budgetCategoryId = v.budgetCategory
        ? (categoryIdByName.get(v.budgetCategory.toLowerCase()) ?? null)
        : null;
      const created = await vendorService.createVendor(weddingId, {
        name: v.name,
        category: v.category,
        status: v.status,
        budgetCategoryId,
        contactName: v.contactName,
        email: v.email,
        phone: v.phone,
        website: v.website,
        estimatedCost: v.estimatedCost,
        notes: v.notes,
      });
      vendorId = created.id;
      vendorIdByKey.set(key, vendorId);
      vendorsCreated++;
    } else {
      vendorsSkipped++;
    }

    if (v.contract) {
      const existingContracts = await contractService.listContractsForVendor(weddingId, vendorId);
      if (existingContracts.length === 0) {
        const contract = await contractService.createContract(weddingId, vendorId, {
          title: v.contract.title,
          totalAmount: v.contract.totalAmount,
          signedOn: v.contract.signedOn,
          notes: v.contract.notes,
        });
        contractsCreated++;

        for (const p of v.contract.payments ?? []) {
          await paymentService.createPayment(weddingId, contract.id, {
            label: p.label,
            amount: p.amount,
            dueDate: p.dueDate,
            paidDate: p.paidDate,
            method: p.method,
            notes: p.notes,
          });
          paymentsCreated++;
        }
      }
    }
  }

  console.log('\nImport complete:');
  console.log(`  Budget categories created: ${categoriesCreated}`);
  console.log(`  Vendors created: ${vendorsCreated} (skipped ${vendorsSkipped} already present)`);
  console.log(`  Contracts created: ${contractsCreated}`);
  console.log(`  Payments created: ${paymentsCreated}`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
