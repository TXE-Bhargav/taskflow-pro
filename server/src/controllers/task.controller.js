// task.controller.js — Handles HTTP requests for tasks
// Validates and extracts req.body fields according to Prisma schema
// Then passes clean data to service layer

const taskService = require('../services/task.service');

// Reusable error wrapper
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── VALID VALUES FROM SCHEMA ENUMS ──────────────────────────
const VALID_STATUSES   = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// ─── CREATE TASK ─────────────────────────────────────────────
const createTask = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  // Destructure ONLY fields that exist in Task schema
  const {
    title,
    description,
    status,
    priority,
    dueDate,
    assigneeId,
    parentId,    // if this task is a subtask
  } = req.body;

  // ── Validation ──
  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Task title is required' });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  // ── Build clean data object — only include fields that were provided ──
  const taskData = {
    title: title.trim(),
    ...(description  && { description: description.trim() }),
    ...(status       && { status }),
    ...(priority     && { priority }),
    ...(dueDate      && { dueDate: new Date(dueDate) }),
    ...(assigneeId   && { assigneeId }),
    ...(parentId     && { parentId }),
  };

  const result = await taskService.createTask(req.user.id, projectId, taskData);
  res.status(201).json(result);
});

// ─── GET ALL TASKS BY PROJECT ─────────────────────────────────
const getTasksByProject = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  // Optional query filters
  const { status, priority, assigneeId } = req.query;

  const result = await taskService.getTasksByProject(
    req.user.id,
    projectId,
    { status, priority, assigneeId }   // pass filters to service
  );
  res.json(result);
});

// ─── GET SINGLE TASK ──────────────────────────────────────────
const getTaskById = catchAsync(async (req, res) => {
  const result = await taskService.getTaskById(req.user.id, req.params.id);
  res.json(result);
});

// ─── UPDATE TASK ──────────────────────────────────────────────
const updateTask = catchAsync(async (req, res) => {
  const {
    title,
    description,
    status,
    priority,
    dueDate,
    assigneeId,
  } = req.body;

  // Validate enums only if they are being updated
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  // Only update fields that were actually sent
  // If a field is undefined, Prisma ignores it — so we won't accidentally wipe data
  const updateData = {
    ...(title       !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(status      !== undefined && { status }),
    ...(priority    !== undefined && { priority }),
    ...(dueDate     !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    ...(assigneeId  !== undefined && { assigneeId: assigneeId || null }),
  };

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'No valid fields provided to update' });
  }

  const result = await taskService.updateTask(req.user.id, req.params.id, updateData);
  res.json(result);
});

// ─── MOVE TASK (Drag & Drop) ──────────────────────────────────
const moveTask = catchAsync(async (req, res) => {
  const { status, position } = req.body;

  // Both fields are required for a move operation
  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }
  if (position === undefined || position === null) {
    return res.status(400).json({ message: 'position is required' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }
  if (typeof position !== 'number' || position < 0) {
    return res.status(400).json({ message: 'position must be a non-negative number' });
  }

  const result = await taskService.moveTask(req.user.id, req.params.id, { status, position });
  res.json(result);
});

// ─── DELETE TASK ──────────────────────────────────────────────
const deleteTask = catchAsync(async (req, res) => {
  const result = await taskService.deleteTask(req.user.id, req.params.id);
  res.json(result);
});

// ─── ADD COMMENT ──────────────────────────────────────────────
const addComment = catchAsync(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  const result = await taskService.addComment(req.user.id, req.params.id, content.trim());
  res.status(201).json(result);
});

// ─── ADD LABEL TO TASK ────────────────────────────────────────
const addLabel = catchAsync(async (req, res) => {
  const { labelId } = req.body;

  if (!labelId) {
    return res.status(400).json({ message: 'labelId is required' });
  }

  const result = await taskService.addLabel(req.user.id, req.params.id, labelId);
  res.status(201).json(result);
});

// ─── REMOVE LABEL FROM TASK ───────────────────────────────────
const removeLabel = catchAsync(async (req, res) => {
  const { labelId } = req.body;

  if (!labelId) {
    return res.status(400).json({ message: 'labelId is required' });
  }

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