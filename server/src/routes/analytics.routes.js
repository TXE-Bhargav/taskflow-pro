const express             = require('express');
const router              = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect }         = require('../middleware/auth.middleware');

router.use(protect);

// Full dashboard in one call
router.get('/dashboard/:workspaceId',     analyticsController.getDashboard);

// Individual chart endpoints
router.get('/overview/:workspaceId',      analyticsController.getOverview);
router.get('/tasks-by-day/:workspaceId',  analyticsController.getTasksByDay);
router.get('/tasks-by-status/:workspaceId', analyticsController.getTasksByStatus);
router.get('/team/:workspaceId',          analyticsController.getTeamPerformance);
router.get('/projects/:workspaceId',      analyticsController.getProjectProgress);
router.get('/personal',                   analyticsController.getPersonalStats);

module.exports = router;