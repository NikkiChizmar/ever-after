import type { ReactNode } from 'react';

/**
 * Shared frame for the public auth pages: brand at top, card in the middle.
 *
 * This is the one screen in the app where the wordmark gets a script
 * flourish — a deliberate, scoped nod to the couple's actual wedding site.
 * Everywhere else (dashboard, Budget Center, forms, tables) stays in
 * Fraunces/Inter: those screens are operational and dense, and a script
 * face there would hurt legibility and undercut the "professional
 * software" read the rest of the product is going for. One emotional
 * moment, confined to the door you walk through once.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="mb-10 text-center">
        <p className="font-script text-7xl leading-none text-foreground">Ever After</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.25em] text-foreground/70">
          The Wedding Operations Platform
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="font-display text-xl font-medium">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
