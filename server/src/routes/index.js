const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const taskRoutes = require('./task.routes');
const projectsRoutes = require('./project.routes');

const router = require('express').Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/tasks', taskRoutes);
router.use('/workspaces/:workspaceId/projects', projectsRoutes);


module.exports = router;