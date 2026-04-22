const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { protect } = require('../middleware/auth.middleware');

// All workspace routes require login
router.use(protect);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/:id/invite', workspaceController.inviteMember);

module.exports = router;