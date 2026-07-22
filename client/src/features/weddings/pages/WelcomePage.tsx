import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateWedding } from '../hooks';

/**
 * First-run onboarding: one question that matters (the name), two that can
 * wait (date and budget are optional — "we don't know yet" is a normal and
 * welcome answer at this stage).
 */
export default function WelcomePage() {
  const navigate = useNavigate();
  const createWedding = useCreateWedding();
  const [name, setName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createWedding.mutate(
      {
        name,
        weddingDate: weddingDate || undefined,
        totalBudget: totalBudget ? Number(totalBudget) : undefined,
      },
      { onSuccess: ({ wedding }) => navigate(`/w/${wedding.id}`, { replace: true }) },
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-20">
      <h1 className="font-display text-3xl font-medium tracking-tight">Let's set the scene.</h1>
      <p className="mt-2 text-foreground/70">
        A name is all we need to begin — everything else can change as plans take shape.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Wedding name</Label>
          <Input
            id="name"
            placeholder="Nikki & Alex"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weddingDate">Wedding date (optional)</Label>
          <Input
            id="weddingDate"
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalBudget">Total budget (optional)</Label>
          <Input
            id="totalBudget"
            type="number"
            min="0"
            step="100"
            placeholder="45000"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
          />
        </div>

        {createWedding.isError && (
          <p role="alert" className="text-sm text-destructive">
            {createWedding.error.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={createWedding.isPending}>
          {createWedding.isPending ? 'Creating…' : 'Create wedding'}
        </Button>
      </form>
    </div>
  );
}
