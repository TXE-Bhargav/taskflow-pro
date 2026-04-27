const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const taskRoutes = require('./task.routes');
const projectsRoutes = require('./project.routes');
const notificationRoutes = require('./notification.routes');
const aiRoutes = require('./ai.routes');
const analyticsRoutes = require('./analytics.routes');

const router = require('express').Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/tasks', taskRoutes);
router.use('/workspaces/:workspaceId/projects', projectsRoutes);
router.use('/projects',                          projectsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);


module.exports = router;