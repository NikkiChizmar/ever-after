import 'dotenv/config';
import { z } from 'zod';

/**
 * Validated server environment.
 *
 * Zod parses process.env at startup and the process exits immediately with a
 * readable error if configuration is missing or malformed. This "fail fast"
 * approach surfaces misconfiguration at boot — in seconds — rather than as a
 * confusing runtime error an hour into a demo.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
