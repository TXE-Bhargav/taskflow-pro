// analytics.controller.js

const analyticsService = require('../services/analytics.service');

const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Full dashboard — all data in ONE request
// Frontend makes 1 call instead of 6 — much faster
const getDashboard = catchAsync(async (req, res) => {
  const { workspaceId } = req.params;

  // Run all queries in parallel — total time = slowest query, not sum of all
  const [
    overview,
    tasksByDay,
    tasksByStatus,
    teamPerformance,
    projectProgress,
    personalStats
  ] = await Promise.all([
    analyticsService.getWorkspaceOverview(workspaceId, req.user.id),
    analyticsService.getTasksCompletedByDay(workspaceId, req.user.id),
    analyticsService.getTasksByStatus(workspaceId, req.user.id),
    analyticsService.getTeamPerformance(workspaceId, req.user.id),
    analyticsService.getProjectProgress(workspaceId, req.user.id),
    analyticsService.getPersonalStats(req.user.id)
  ]);

  res.json({
    overview,
    tasksByDay,
    tasksByStatus,
    teamPerformance,
    projectProgress,
    personalStats
  });
});

// Individual endpoints — if frontend needs specific charts
const getOverview        = catchAsync(async (req, res) => {
  const result = await analyticsService.getWorkspaceOverview(req.params.workspaceId, req.user.id);
  res.json(result);
});

const getTasksByDay      = catchAsync(async (req, res) => {
  const result = await analyticsService.getTasksCompletedByDay(req.params.workspaceId, req.user.id);
  res.json(result);
});

const getTasksByStatus   = catchAsync(async (req, res) => {
  const result = await analyticsService.getTasksByStatus(req.params.workspaceId, req.user.id);
  res.json(result);
});

const getTeamPerformance = catchAsync(async (req, res) => {
  const result = await analyticsService.getTeamPerformance(req.params.workspaceId, req.user.id);
  res.json(result);
});

const getProjectProgress = catchAsync(async (req, res) => {
  const result = await analyticsService.getProjectProgress(req.params.workspaceId, req.user.id);
  res.json(result);
});

const getPersonalStats   = catchAsync(async (req, res) => {
  const result = await analyticsService.getPersonalStats(req.user.id);
  res.json(result);
});

module.exports = {
  getDashboard,
  getOverview,
  getTasksByDay,
  getTasksByStatus,
  getTeamPerformance,
  getProjectProgress,
  getPersonalStats
};