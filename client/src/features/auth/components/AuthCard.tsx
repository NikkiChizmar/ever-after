import type { ReactNode } from 'react';

/**
 * Shared frame for the public auth pages: brand at top, card in the middle.
 * Kept dumb on purpose — pages own their forms and state.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 text-center">
        <p className="font-display text-2xl font-medium tracking-tight">Ever After</p>
        <p className="mt-1 text-sm text-muted-foreground">The Wedding Operations Platform</p>
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="font-display text-xl font-medium">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
