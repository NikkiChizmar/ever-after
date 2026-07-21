import type { Request, Response } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { SESSION_COOKIE, SESSION_TTL_MS, destroySession } from '../lib/sessions.js';
import { loginUser, registerUser } from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true, // invisible to JavaScript — XSS can't steal it
  sameSite: 'lax' as const, // not sent on cross-site POSTs — CSRF baseline
  secure: env.NODE_ENV === 'production', // HTTPS-only outside dev
  maxAge: SESSION_TTL_MS,
  path: '/',
};

const registerSchema = z.object({
  email: z.string().email().max(254),
  // Max 72: bcrypt truncates beyond 72 bytes — see lib/passwords.ts.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  fullName: z.string().trim().min(1, 'Name is required').max(120),
});

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, token } = await registerUser(input);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.status(201).json({ user });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, token } = await loginUser(input.email, input.password);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
  res.json({ user });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    await destroySession(token); // revoke server-side, not just in the browser
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  // requireAuth has already attached the user.
  res.json({ user: req.user });
}
