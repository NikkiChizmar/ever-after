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
