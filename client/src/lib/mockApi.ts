import { ApiError } from './api';
import {
  DEMO_BUDGET_SUMMARY,
  DEMO_MEMBERS,
  DEMO_ROLE,
  DEMO_TASKS,
  DEMO_USER,
  DEMO_VENDOR_PAYMENTS,
  DEMO_VENDORS,
  DEMO_WEDDING,
} from './mockData';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

const READ_ONLY_MESSAGE = 'This is a read-only public demo — nothing here can be changed.';

/**
 * Stands in for lib/api.ts's real fetch() call when DEMO_MODE is on (see
 * lib/api.ts). Every GET a real backend would answer is answered here from
 * lib/mockData.ts instead; every write throws the exact same ApiError shape
 * a real 403 would — so every dialog's existing `mutation.error.message`
 * rendering (see AddVendorDialog, AddTaskDialog, etc.) surfaces this
 * message with zero special-casing, whether the read-only-ness comes from
 * a real server or, as here, from never reaching one.
 *
 * Matches on path shape rather than exact strings so a single wedding id
 * works everywhere it's asked for — there's only ever one demo wedding.
 */
export function mockApi<T>(path: string, options: RequestOptions = {}): T {
  const method = options.method ?? 'GET';
  const segments = path.split('/').filter(Boolean);

  if (method === 'GET') {
    if (segments[0] === 'auth' && segments[1] === 'me') {
      return { user: DEMO_USER } as T;
    }
    if (segments[0] === 'weddings' && segments.length === 1) {
      return { weddings: [{ ...DEMO_WEDDING, role: DEMO_ROLE }] } as T;
    }
    if (segments[0] === 'weddings' && segments.length === 2) {
      return { wedding: DEMO_WEDDING, role: DEMO_ROLE } as T;
    }
    if (segments[0] === 'weddings' && segments[2] === 'members') {
      return { members: DEMO_MEMBERS } as T;
    }
    if (segments[0] === 'weddings' && segments[2] === 'vendors') {
      return { vendors: DEMO_VENDORS } as T;
    }
    if (segments[0] === 'weddings' && segments[2] === 'vendor-payment-summary') {
      return { vendorPayments: DEMO_VENDOR_PAYMENTS } as T;
    }
    if (segments[0] === 'weddings' && segments[2] === 'budget-summary') {
      return DEMO_BUDGET_SUMMARY as T;
    }
    if (segments[0] === 'weddings' && segments[2] === 'tasks') {
      return { tasks: DEMO_TASKS } as T;
    }
    // A GET we don't recognize — treat like a real backend would for an
    // unmatched route, rather than silently returning nothing.
    throw new ApiError(404, 'Not found');
  }

  // Every write — create/update/delete a vendor, category, or task; login;
  // register — is rejected the same way. Nothing in this file ever
  // mutates lib/mockData.ts's exports.
  throw new ApiError(403, READ_ONLY_MESSAGE);
}
