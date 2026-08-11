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
import { useUpdateTask } from '../hooks';
import type { Task } from '../api';

/**
 * Same fields and layout as AddTaskDialog, just pre-filled from an
 * existing task and saved with a PATCH instead of a POST — there was no
 * way to change a task's title/date/assignee/category/vendor once
 * created before this (only status, via TaskStatusSelect).
 */
export function EditTaskDialog({
  weddingId,
  vendors,
  task,
  trigger,
}: {
  weddingId: string;
  vendors: Vendor[];
  task: Task;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [assigneeMemberId, setAssigneeMemberId] = useState(task.assigneeMemberId ?? 'unassigned');
  const [assigneeLabel, setAssigneeLabel] = useState(task.assigneeLabel ?? '');
  const [vendorId, setVendorId] = useState(task.vendorId ?? 'none');
  const [category, setCategory] = useState(task.category ?? 'none');
  const [section, setSection] = useState(task.section ?? '');
  const { data: members } = useMembers(weddingId);
  const updateTask = useUpdateTask(weddingId);
  const bookedVendors = vendors.filter((vendor) => vendor.status === 'booked');

  // Reset the form back to the task's current values whenever the dialog
  // reopens, so a cancelled edit never leaves stale input behind.
  function handleOpenChange(next: boolean) {
    if (next) {
      setTitle(task.title);
      setDueDate(task.dueDate ?? '');
      setAssigneeMemberId(task.assigneeMemberId ?? 'unassigned');
      setAssigneeLabel(task.assigneeLabel ?? '');
      setVendorId(task.vendorId ?? 'none');
      setCategory(task.category ?? 'none');
      setSection(task.section ?? '');
    }
    setOpen(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateTask.mutate(
      {
        taskId: task.id,
        input: {
          title,
          dueDate: dueDate || null,
          assigneeMemberId: assigneeMemberId === 'unassigned' ? null : assigneeMemberId,
          assigneeLabel: assigneeMemberId === 'unassigned' && assigneeLabel ? assigneeLabel : null,
          vendorId: vendorId === 'none' ? null : vendorId,
          category: category === 'none' ? null : category,
          section: section.trim() || null,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update the details — status stays a quick pick from the card.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editTaskTitle">Title</Label>
            <Input
              id="editTaskTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editTaskDueDate">Due date (optional)</Label>
            <Input
              id="editTaskDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editTaskAssignee">Assigned to (optional)</Label>
            <Select value={assigneeMemberId} onValueChange={setAssigneeMemberId}>
              <SelectTrigger id="editTaskAssignee">
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
            <Label htmlFor="editTaskCategory">Event (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="editTaskCategory">
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
          <div className="space-y-2">
            <Label htmlFor="editTaskSection">Section (optional)</Label>
            <Input
              id="editTaskSection"
              placeholder="Reception tables, cookie table, guest book table…"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
          </div>
          {bookedVendors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="editTaskVendor">Related vendor (optional)</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger id="editTaskVendor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {bookedVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {updateTask.isError && (
            <p role="alert" className="text-sm text-destructive">
              {updateTask.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={updateTask.isPending || !title.trim()}>
              {updateTask.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
