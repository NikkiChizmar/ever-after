import { Router } from 'express';

import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../controllers/task.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const taskRouter: Router = Router({ mergeParams: true });

taskRouter.get('/tasks', requireWeddingRole('viewer'), listTasks);
taskRouter.post('/tasks', requireWeddingRole('editor'), createTask);
taskRouter.get('/tasks/:taskId', requireWeddingRole('viewer'), getTask);
taskRouter.patch('/tasks/:taskId', requireWeddingRole('editor'), updateTask);
taskRouter.delete('/tasks/:taskId', requireWeddingRole('editor'), deleteTask);
