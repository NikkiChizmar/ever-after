import { useParams } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useWedding } from '../hooks';

function formatMoney(amount: string | null, currency: string): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year!, month! - 1, day!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const upcomingModules = [
  { title: 'Budget Center', description: 'Planned vs. committed vs. paid, by category.' },
  { title: 'Guests & RSVPs', description: 'Parties, per-event invitations, meals.' },
  { title: 'Vendors', description: 'From first inquiry to final payment.' },
  { title: 'Tasks', description: 'Everything that must happen, owned by someone.' },
];

export default function DashboardPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data, isPending, isError, error } = useWedding(weddingId!);

  if (isPending) {
    return <p className="px-6 py-20 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-6 py-20 text-center text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  const { wedding, role } = data;
  const countdown = daysUntil(wedding.weddingDate);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {role === 'owner' ? 'Your wedding' : `Shared with you · ${role}`}
          </p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">{wedding.name}</h1>
        </div>
        {countdown !== null && countdown >= 0 && (
          <p className="text-right">
            <span className="font-display text-3xl font-medium">{countdown}</span>
            <span className="ml-2 text-sm text-muted-foreground">days to go</span>
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Date</CardDescription>
            <CardTitle className="font-display text-xl font-medium">
              {wedding.weddingDate ?? 'Not set yet'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="font-display text-xl font-medium">
              {formatMoney(wedding.totalBudget, wedding.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Your role</CardDescription>
            <CardTitle className="font-display text-xl font-medium capitalize">{role}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <h2 className="font-display mt-14 text-lg font-medium">Coming next</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {upcomingModules.map((module) => (
          <Card key={module.title} className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                {module.title}
              </CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/70">
                In development
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
