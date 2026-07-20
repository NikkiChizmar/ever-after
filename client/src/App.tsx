import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const foundations = [
  { label: 'React 19 + TypeScript + Vite', detail: 'Type-safe UI with instant feedback' },
  { label: 'Tailwind CSS 4 + shadcn/ui', detail: 'Design system with semantic tokens' },
  { label: 'Express + TypeScript API', detail: 'Layered backend, ready for features' },
  { label: 'ESLint + Prettier', detail: 'Consistent, enforced code quality' },
];

/**
 * Temporary foundation page.
 * Exists to prove the design system works end to end; replaced by the
 * real application shell in the first feature milestone.
 */
export default function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <span className="font-display text-xl font-medium tracking-tight">Ever After</span>
          <span className="text-sm text-muted-foreground">The Wedding Operations Platform</span>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Foundation · v0.1
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-5xl font-medium leading-tight tracking-tight">
            Every part of your wedding, one beautiful workspace.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Budgets, vendors, guests, timelines, and decisions — planned with the calm and clarity
            of a well-run operation.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg">
              Start planning
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              View the roadmap
            </Button>
          </div>

          <Card className="mt-16">
            <CardHeader>
              <CardTitle className="font-display text-lg font-medium">
                Project foundation
              </CardTitle>
              <CardDescription>
                What this build ships with before the first feature is written.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-4 sm:grid-cols-2">
                {foundations.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-6">
          <p className="text-sm text-muted-foreground">
            Ever After — a product engineering portfolio project.
          </p>
        </div>
      </footer>
    </div>
  );
}
