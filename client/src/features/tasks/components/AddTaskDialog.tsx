import { useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMembers } from '@/features/weddings/hooks';
import type { Vendor } from '@/features/vendors/api';
import { TASK_CATEGORIES } from '../constants';
import { useCreateTask } from '../hooks';

export function AddTaskDialog({
  weddingId,
  vendors,
  trigger,
}: {
  weddingId: string;
  vendors: Vendor[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeMemberId, setAssigneeMemberId] = useState('unassigned');
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const [vendorId, setVendorId] = useState('none');
  const [category, setCategory] = useState('none');
  const { data: members } = useMembers(weddingId);
  const createTask = useCreateTask(weddingId);

  function reset() {
    setTitle('');
    setDueDate('');
    setAssigneeMemberId('unassigned');
    setAssigneeLabel('');
    setVendorId('none');
    setCategory('none');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createTask.mutate(
      {
        title,
        dueDate: dueDate || undefined,
        assigneeMemberId: assigneeMemberId === 'unassigned' ? undefined : assigneeMemberId,
        // Only a free-text label if no real member is picked — the two are
        // mutually exclusive (see docs/data-model.md §2.14).
        assigneeLabel: assigneeMemberId === 'unassigned' && assigneeLabel ? assigneeLabel : undefined,
        vendorId: vendorId === 'none' ? undefined : vendorId,
        category: category === 'none' ? undefined : category,
      },
      { onSuccess: () => { setOpen(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>One unit of work — as small or big as you need.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Title</Label>
            <Input
              id="taskTitle"
              placeholder="Mail invitations"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDueDate">Due date (optional)</Label>
            <Input
              id="taskDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskAssignee">Assigned to (optional)</Label>
            <Select value={assigneeMemberId} onValueChange={setAssigneeMemberId}>
              <SelectTrigger id="taskAssignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assigneeMemberId === 'unassigned' && (
              <Input
                placeholder="Or just a name — Mom, best man, the florist…"
                value={assigneeLabel}
                onChange={(e) => setAssigneeLabel(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskCategory">Part of the day (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="taskCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {TASK_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {vendors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="taskVendor">Related vendor (optional)</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger id="taskVendor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {createTask.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createTask.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending ? 'Adding…' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
