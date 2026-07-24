import { env } from '@/config/env';
import { DEMO_MODE } from './demo';
import { mockApi } from './mockApi';

/**
 * The one place the client talks HTTP. Every feature's api.ts goes through
 * this wrapper, so credentials, JSON handling, and error shape are decided
 * exactly once.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // The public demo build has no backend at all — see lib/mockApi.ts and
  // docs/deploying-the-demo.md for why (it's a static site, not a second
  // deployment to run and pay for). Every other build (including local
  // dev) never takes this branch, since DEMO_MODE is false there.
  if (DEMO_MODE) {
    return mockApi<T>(path, options);
  }

  const response = await fetch(`${env.apiUrl}/api${path}`, {
    method: options.method ?? 'GET',
    // Send the session cookie. In dev the Vite proxy makes this same-origin.
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? `Request failed (${response.status})`);
  }

  return data as T;
}
