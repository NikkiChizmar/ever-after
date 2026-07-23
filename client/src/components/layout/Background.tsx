import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export interface BackgroundProps {
  /** How visible the illustration is. Keep this low — the brief is "never
   * competes with the UI." Default matches what reads as a quiet paper
   * texture behind ivory cards without fighting page-level text. */
  opacity?: number;
  /** Multiplier on the responsive base tile size (bigger = each repeat of
   * the artwork covers more screen = fewer, larger repeats). 1 = default. */
  scale?: number;
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  className?: string;
}

/**
 * Renders the wedding-doodle illustration (public/patterns/wedding-doodle-
 * hero.{webp,png}) as a fixed, full-viewport layer behind all app content.
 * Mounted once (see App.tsx) rather than per-page — every route sits on
 * top of the same layer, so nothing needs to know it's there.
 *
 * Theming: color treatment for a future light/dark split lives in CSS
 * (.bg-doodle-pattern and the mix-blend-mode that strips the artwork's
 * white background), not here — this component only carries the
 * per-instance knobs (opacity/scale/repeat) a consumer might reasonably
 * want to override.
 */
export function Background({ opacity = 0.22, scale = 1, repeat = 'repeat', className }: BackgroundProps) {
  const style = {
    opacity,
    '--doodle-scale': scale,
    '--doodle-repeat': repeat,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      className={cn('bg-doodle-pattern pointer-events-none fixed inset-0 -z-10', className)}
      style={style}
    />
  );
}
