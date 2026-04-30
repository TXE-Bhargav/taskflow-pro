const taskService = require('../services/task.service');
const prisma = require('../config/prisma');

const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ── Helper — get workspaceId from a task ──
const getWorkspaceId = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { select: { workspaceId: true } } }
  });
  return task?.project?.workspaceId || null;
};

// ── Helper — get workspaceId from a project ──
const getWorkspaceIdFromProject = async (projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true }
  });
  return project?.workspaceId || null;
};

const createTask = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status, priority, dueDate, assigneeId, parentId } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Task title is required' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status` });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: `Invalid priority` });
  }

  const taskData = {
    title: title.trim(),
    ...(description && { description: description.trim() }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(dueDate && { dueDate: new Date(dueDate) }),
    ...(assigneeId && { assigneeId }),
    ...(parentId && { parentId }),
  };

  const result = await taskService.createTask(req.user.id, projectId, taskData);

  // Get workspaceId from DB — don't trust frontend body
  const workspaceId = await getWorkspaceIdFromProject(projectId);
  if (workspaceId && req.io) {
    req.io.to(`workspace:${workspaceId}`).emit('task:created', {
      task: result,
      projectId, // so frontend knows which board to update
      createdBy: req.user.name
    });
    console.log(`📡 Emitted task:created to workspace:${workspaceId}`);
  }

  res.status(201).json(result);
});

const getTasksByProject = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assigneeId } = req.query;
  const result = await taskService.getTasksByProject(
    req.user.id, projectId, { status, priority, assigneeId }
  );
  res.json(result);
});

const getTaskById = catchAsync(async (req, res) => {
  const result = await taskService.getTaskById(req.user.id, req.params.id);
  res.json(result);
});

const updateTask = catchAsync(async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status` });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: `Invalid priority` });
  }

  const updateData = {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(status !== undefined && { status }),
    ...(priority !== undefined && { priority }),
    ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
  };

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const result = await taskService.updateTask(req.user.id, req.params.id, updateData);

  // Get workspaceId from DB
  const workspaceId = await getWorkspaceId(req.params.id);
  if (workspaceId && req.io) {
    req.io.to(`workspace:${workspaceId}`).emit('task:updated', {
      task: result,
      updatedBy: req.user.name
    });
    console.log(`📡 Emitted task:updated to workspace:${workspaceId}`);
  }

  res.json(result);
});

const moveTask = catchAsync(async (req, res) => {
  const { status, position } = req.body;

  if (!status) return res.status(400).json({ message: 'status is required' });
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const pos = parseInt(position ?? 0, 10);
  const result = await taskService.moveTask(req.user.id, req.params.id, {
    status,
    position: isNaN(pos) ? 0 : pos
  });

  // Get workspaceId from DB — this is the key fix
  const workspaceId = await getWorkspaceId(req.params.id);
  if (workspaceId && req.io) {
    req.io.to(`workspace:${workspaceId}`).emit('task:moved', {
      taskId: req.params.id,
      status,
      movedBy: req.user.name
    });
    console.log(`📡 Emitted task:moved to workspace:${workspaceId}`);
  }

  res.json(result);
});

const deleteTask = catchAsync(async (req, res) => {
  // Get workspaceId BEFORE deleting — after delete the task is gone
  const workspaceId = await getWorkspaceId(req.params.id);

  const result = await taskService.deleteTask(req.user.id, req.params.id);

  if (workspaceId && req.io) {
    req.io.to(`workspace:${workspaceId}`).emit('task:deleted', {
      taskId: req.params.id,
      deletedBy: req.user.name
    });
    console.log(`📡 Emitted task:deleted to workspace:${workspaceId}`);
  }

  res.json(result);
});

const addComment = catchAsync(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const result = await taskService.addComment(
    req.user.id, req.params.id, content.trim()
  );

  // Get workspaceId from DB
  const workspaceId = await getWorkspaceId(req.params.id);
  if (workspaceId && req.io) {
    req.io.to(`workspace:${workspaceId}`).emit('comment:added', {
      comment: result,
      taskId: req.params.id
    });
    console.log(`📡 Emitted comment:added to workspace:${workspaceId}`);
  }

  res.status(201).json(result);
});

const addLabel = catchAsync(async (req, res) => {
  const { labelId } = req.body;
  if (!labelId) return res.status(400).json({ message: 'labelId is required' });
  const result = await taskService.addLabel(req.user.id, req.params.id, labelId);
  res.status(201).json(result);
});

const removeLabel = catchAsync(async (req, res) => {
  const { labelId } = req.body;
  if (!labelId) return res.status(400).json({ message: 'labelId is required' });
  const result = await taskService.removeLabel(req.user.id, req.params.id, labelId);
  res.json(result);
});

module.exports = {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
  addLabel,
  removeLabel
};