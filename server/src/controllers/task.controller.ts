import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as taskService from '../services/task.service.js';

const taskStatus = z.enum(['todo', 'in_progress', 'done']);

export async function listTasks(req: Request, res: Response) {
  const tasks = await taskService.listTasks(req.membership!.weddingId);
  res.json({ tasks });
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().max(4000).optional(),
  status: taskStatus.optional(),
  dueDate: z.string().date().nullable().optional(),
  assigneeMemberId: z.string().uuid().nullable().optional(),
  assigneeLabel: z.string().trim().min(1).max(100).nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(100).optional(),
});

export async function createTask(req: Request, res: Response) {
  const input = createTaskSchema.parse(req.body);
  const task = await taskService.createTask(req.membership!.weddingId, input);
  res.status(201).json({ task });
}

export async function getTask(req: Request, res: Response) {
  const task = await taskService.getTask(req.membership!.weddingId, uuidParam(req, 'taskId'));
  res.json({ task });
}

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  status: taskStatus.optional(),
  dueDate: z.string().date().nullable().optional(),
  assigneeMemberId: z.string().uuid().nullable().optional(),
  assigneeLabel: z.string().trim().min(1).max(100).nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
});

export async function updateTask(req: Request, res: Response) {
  const input = updateTaskSchema.parse(req.body);
  const task = await taskService.updateTask(req.membership!.weddingId, uuidParam(req, 'taskId'), input);
  res.json({ task });
}

export async function deleteTask(req: Request, res: Response) {
  await taskService.deleteTask(req.membership!.weddingId, uuidParam(req, 'taskId'));
  res.status(204).end();
}
