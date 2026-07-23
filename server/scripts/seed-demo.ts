import { readFileSync } from 'node:fs';
import path from 'node:path';

import { DEMO_USER_EMAIL } from '../src/lib/demo.js';
import { DUMMY_HASH } from '../src/lib/passwords.js';
import { pool, query } from '../src/db/pool.js';
import * as budgetService from '../src/services/budget.service.js';
import * as contractService from '../src/services/contract.service.js';
import * as paymentService from '../src/services/payment.service.js';
import * as taskService from '../src/services/task.service.js';
import * as vendorService from '../src/services/vendor.service.js';
import type { PaymentMethod } from '../src/services/payment.service.js';
import type { VendorCategory, VendorStatus } from '../src/services/vendor.service.js';

/**
 * Populates the fixed account the public read-only demo authenticates as
 * (see lib/demo.ts, middleware/auth.ts) with an entirely fictional wedding
 * — a couple, vendors in every status, a couple of contracts and payments,
 * and a handful of tasks. Never touches — never even looks at — any other
 * wedding in the database, so it's safe to run against the same database
 * as real data (local dev) as well as the dedicated demo database.
 *
 * Idempotent, same pattern as import-vendors.ts: safe to re-run after a
 * schema change or to top up if data was added to demo-seed.json.
 *
 * Usage: npm run seed:demo -w server
 */

interface DemoPayment {
  label: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  method?: PaymentMethod;
}

interface DemoContract {
  title?: string;
  totalAmount: number;
  signedOn?: string;
  payments?: DemoPayment[];
}

interface DemoVendor {
  name: string;
  category: VendorCategory;
  budgetCategory?: string;
  status?: VendorStatus;
  estimatedCost?: number;
  contactName?: string;
  notes?: string;
  contract?: DemoContract;
}

interface DemoSeedData {
  wedding: { name: string; currency: string; totalBudget?: number };
  budgetCategories: { name: string; plannedAmount?: number }[];
  vendors: DemoVendor[];
}

/** `now + days`, formatted YYYY-MM-DD — so the demo always looks "current"
 * (a mix of overdue, upcoming, and done tasks) no matter when someone loads
 * it, rather than going stale relative to a hardcoded date. */
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function ensureDemoUser(): Promise<string> {
  const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
    DEMO_USER_EMAIL,
  ]);
  if (existing[0]) {
    return existing[0].id;
  }

  const created = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id`,
    // DUMMY_HASH never validates against any real input — appropriate here
    // since the demo has no real login at all (auth is bypassed entirely
    // when DEMO_MODE=true; see middleware/auth.ts), but the column is
    // NOT NULL and a real bcrypt hash costs nothing to reuse.
    [DEMO_USER_EMAIL, DUMMY_HASH, 'Demo Viewer'],
  );
  console.log(`Created demo user (${DEMO_USER_EMAIL}).`);
  return created[0]!.id;
}

async function ensureDemoWedding(userId: string, name: string, currency: string, totalBudget?: number) {
  const existing = await query<{ id: string }>(
    `SELECT w.id FROM weddings w
       JOIN wedding_members m ON m.wedding_id = w.id
      WHERE m.user_id = $1`,
    [userId],
  );
  if (existing[0]) {
    return existing[0].id;
  }

  const wedding = await query<{ id: string }>(
    `INSERT INTO weddings (name, currency, total_budget)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, currency, totalBudget ?? null],
  );
  const weddingId = wedding[0]!.id;

  // 'viewer', not 'owner': this membership's role is the actual mechanism
  // that makes the demo read-only (requireWeddingRole rejects any write
  // route for a rank below what it demands) — everything in app.ts/
  // middleware/auth.ts just makes sure every visitor lands on this one
  // account and never gets the chance to register a different one.
  await query(
    `INSERT INTO wedding_members (wedding_id, user_id, role, status)
     VALUES ($1, $2, 'viewer', 'active')`,
    [weddingId, userId],
  );
  console.log(`Created demo wedding "${name}".`);
  return weddingId;
}

async function main() {
  const dataPath = path.resolve(import.meta.dirname, 'data/demo-seed.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf-8')) as DemoSeedData;

  const userId = await ensureDemoUser();
  const weddingId = await ensureDemoWedding(
    userId,
    data.wedding.name,
    data.wedding.currency,
    data.wedding.totalBudget,
  );

  let categoriesCreated = 0;
  let vendorsCreated = 0;
  let contractsCreated = 0;
  let paymentsCreated = 0;
  let tasksCreated = 0;

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
  const vendorIdByName = new Map(existingVendors.map((v) => [v.name.toLowerCase(), v.id]));

  for (const v of data.vendors) {
    let vendorId = vendorIdByName.get(v.name.toLowerCase());

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
        estimatedCost: v.estimatedCost,
        notes: v.notes,
      });
      vendorId = created.id;
      vendorIdByName.set(v.name.toLowerCase(), vendorId);
      vendorsCreated++;
    }

    if (v.contract) {
      const existingContracts = await contractService.listContractsForVendor(weddingId, vendorId);
      if (existingContracts.length === 0) {
        const contract = await contractService.createContract(weddingId, vendorId, {
          title: v.contract.title,
          totalAmount: v.contract.totalAmount,
          signedOn: v.contract.signedOn,
        });
        contractsCreated++;

        for (const p of v.contract.payments ?? []) {
          await paymentService.createPayment(weddingId, contract.id, {
            label: p.label,
            amount: p.amount,
            dueDate: p.dueDate,
            paidDate: p.paidDate,
            method: p.method,
          });
          paymentsCreated++;
        }
      }
    }
  }

  // Tasks: dates computed relative to "now" (see daysFromNow) rather than
  // stored in the JSON, and vendorId resolved from what was just created —
  // both reasons this list lives in code, not demo-seed.json.
  const existingTasks = await taskService.listTasks(weddingId);
  const existingTitles = new Set(existingTasks.map((t) => t.title));
  const vendorId = (name: string) => vendorIdByName.get(name.toLowerCase()) ?? null;

  const demoTasks: {
    title: string;
    status?: 'todo' | 'in_progress' | 'done';
    dueDate?: string;
    assigneeLabel?: string;
    vendorId?: string | null;
  }[] = [
    { title: 'Send save-the-dates', status: 'done', assigneeLabel: 'Priya' },
    { title: 'Book venue walkthrough', status: 'done', assigneeLabel: 'Sam' },
    {
      title: 'Confirm final headcount with caterer',
      status: 'in_progress',
      dueDate: daysFromNow(12),
      assigneeLabel: 'Priya',
      vendorId: vendorId('Saffron Table Catering'),
    },
    {
      title: 'Schedule dress fitting',
      status: 'in_progress',
      dueDate: daysFromNow(9),
      assigneeLabel: 'Priya',
    },
    {
      title: 'Book hair & makeup trial',
      status: 'todo',
      dueDate: daysFromNow(-5), // deliberately overdue — shows the "Due" highlight
      assigneeLabel: 'Priya',
      vendorId: vendorId('Bloom & Brush Beauty'),
    },
    { title: 'Finalize seating chart', status: 'todo', dueDate: daysFromNow(21), assigneeLabel: 'Sam' },
    { title: 'Order wedding bands', status: 'todo', dueDate: daysFromNow(35) },
    { title: 'Mail invitations', status: 'todo', dueDate: daysFromNow(18), assigneeLabel: 'Priya' },
    { title: 'Choose ceremony readings', status: 'todo', dueDate: daysFromNow(28) },
    {
      title: 'Confirm final balance due date with venue',
      status: 'todo',
      dueDate: daysFromNow(60),
      vendorId: vendorId('Willowmere Estate'),
    },
  ];

  for (const t of demoTasks) {
    if (existingTitles.has(t.title)) continue;
    await taskService.createTask(weddingId, {
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      assigneeLabel: t.assigneeLabel,
      vendorId: t.vendorId,
    });
    tasksCreated++;
  }

  console.log('\nDemo seed complete:');
  console.log(`  Budget categories created: ${categoriesCreated}`);
  console.log(`  Vendors created: ${vendorsCreated}`);
  console.log(`  Contracts created: ${contractsCreated}`);
  console.log(`  Payments created: ${paymentsCreated}`);
  console.log(`  Tasks created: ${tasksCreated}`);
}

main()
  .catch((err) => {
    console.error('Demo seed failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
