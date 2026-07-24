import { CheckIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { DEMO_MODE } from '@/lib/demo';
import { useUpdateTask } from '../hooks';
import { TASK_STATUS_BADGE_VARIANT, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from '../constants';
import type { TaskStatus } from '../api';

/**
 * Same "badge that's secretly a select" trick as VendorStatusSelect — status
 * is the one field people change constantly while working through a task
 * list, so it saves on pick with no separate edit flow.
 */
export function TaskStatusSelect({
  weddingId,
  taskId,
  status,
}: {
  weddingId: string;
  taskId: string;
  status: TaskStatus;
}) {
  const updateTask = useUpdateTask(weddingId);

  return (
    <Select
      value={status}
      onValueChange={(next) => updateTask.mutate({ taskId, input: { status: next as TaskStatus } })}
      disabled={DEMO_MODE}
    >
      <SelectTrigger className="h-auto w-auto border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <Badge variant={TASK_STATUS_BADGE_VARIANT[status]} className="gap-1">
          {status === 'done' && <CheckIcon className="size-3" />}
          {TASK_STATUS_LABELS[status]}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUS_ORDER.map((value) => (
          <SelectItem key={value} value={value}>
            {TASK_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
