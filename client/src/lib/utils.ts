import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution.
 * `cn('p-2', condition && 'p-4')` → 'p-4' when condition is true,
 * instead of both classes fighting each other.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
