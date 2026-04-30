
// ai.controller.js — Handles AI feature API requests
// Each endpoint calls one AI service function
// We add rate limiting here to control API costs

const aiService = require('../services/ai.service');
const prisma    = require('../config/prisma');

const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── RATE LIMITER ─────────────────────────────────────────────
// Simple in-memory rate limiter — each user gets 20 AI calls per hour
// In production you'd use Redis for this
const rateLimits = new Map();

const checkRateLimit = (userId) => {
  const now    = Date.now();
  const window = 60 * 60 * 1000; // 1 hour in milliseconds
  const limit  = 20;

  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, { count: 1, resetAt: now + window });
    return true;
  }

  const userLimit = rateLimits.get(userId);

  // Reset if window expired
  if (now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + window });
    return true;
  }

  // Check if over limit
  if (userLimit.count >= limit) return false;

  // Increment count
  userLimit.count++;
  return true;
};

// ─── BREAKDOWN TASK ───────────────────────────────────────────
const breakdownTask = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { goal, projectContext } = req.body;
  if (!goal) return res.status(400).json({ message: 'Goal is required' });

  const result = await aiService.breakdownTask(goal, projectContext);
  res.json(result);
});

// ─── PRIORITIZE TASKS ─────────────────────────────────────────
const prioritizeTasks = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { projectId } = req.params;

  // Fetch actual tasks from DB
  const tasks = await prisma.task.findMany({
    where: { projectId, status: { not: 'DONE' } },
    select: { id: true, title: true, priority: true, dueDate: true }
  });

  if (!tasks.length) {
    return res.status(400).json({ message: 'No active tasks found in this project' });
  }

  const result = await aiService.prioritizeTasks(tasks);
  res.json(result);
});

// ─── SUGGEST DUE DATE ─────────────────────────────────────────
const suggestDueDate = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { title, description, teamSize } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required' });

  const result = await aiService.suggestDueDate(title, description, teamSize);
  res.json(result);
});

// ─── GENERATE STANDUP ─────────────────────────────────────────
const generateStandup = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  // Auto-fetch user's tasks from DB — no manual input needed
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const completedTasks = await prisma.task.findMany({
    where: {
      assigneeId: req.user.id,
      status: 'DONE',
      updatedAt: { gte: yesterday }
    },
    select: { title: true }
  });

  const inProgressTasks = await prisma.task.findMany({
    where: {
      assigneeId: req.user.id,
      status: 'IN_PROGRESS'
    },
    select: { title: true }
  });

  const result = await aiService.generateStandup(
    req.user.name,
    completedTasks,
    inProgressTasks
  );

  res.json(result);
});

// ─── IMPROVE DESCRIPTION ──────────────────────────────────────
const improveDescription = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Task title is required' });

  const result = await aiService.improveDescription(title, description);
  res.json(result);
});

const suggestWorkspace = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { rawIdea } = req.body;
  if (!rawIdea) return res.status(400).json({ message: 'Raw idea is required' });

  const result = await aiService.suggestWorkspace(rawIdea);
  res.json(result);
});

const suggestProject = catchAsync(async (req, res) => {
  if (!checkRateLimit(req.user.id)) {
    return res.status(429).json({ message: 'AI rate limit reached. Try again in an hour.' });
  }

  const { rawIdea, workspaceName } = req.body;
  if (!rawIdea || !workspaceName) return res.status(400).json({ message: 'Raw idea and workspace name are required' });

  const result = await aiService.suggestProject(rawIdea, workspaceName);
  res.json(result);
});

module.exports = {
  breakdownTask,
  prioritizeTasks,
  suggestDueDate,
  generateStandup,
  improveDescription,
  suggestWorkspace,
  suggestProject
};