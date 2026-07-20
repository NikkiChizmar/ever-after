/**
 * Typed access to client environment variables.
 *
 * Vite exposes only variables prefixed with VITE_ to the browser bundle —
 * a deliberate safety boundary so server secrets can never leak into
 * client code. Access env through this module rather than import.meta.env
 * directly so there is exactly one place to see what the client depends on.
 */
export const env = {
  /** Base URL for API requests. Empty string = same origin (dev proxy handles it). */
  apiUrl: import.meta.env.VITE_API_URL ?? '',
} as const;
