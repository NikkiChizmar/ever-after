import type { Request } from 'express';

import { HttpError } from './http-error.js';

/**
 * Reads a route param as a plain string. Express 5's types allow params to
 * be string[] (path-to-regexp supports repeated segments like `:id+`), even
 * though none of our routes use that syntax — every param here is always a
 * single string at runtime. This is the one place that assumption is stated
 * and checked, instead of a non-null assertion at every call site.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new HttpError(400, `Missing route parameter: ${name}`);
  }
  return value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Like param(), but for IDs that get compared against a uuid column.
 * A malformed value (a typo, a stray placeholder like "EVENT_ID" left in a
 * request) would otherwise reach Postgres and come back as a raw driver
 * error with a stack trace — a 500 that leaks internals. Validating the
 * shape here instead turns it into the same clean 404 a well-formed but
 * nonexistent ID would produce, which also avoids confirming to a caller
 * whether an ID is "malformed" vs. "doesn't exist" (see wedding-access.ts).
 */
export function uuidParam(req: Request, name: string): string {
  const value = param(req, name);
  if (!UUID_RE.test(value)) {
    throw new HttpError(404, 'Not found');
  }
  return value;
}
