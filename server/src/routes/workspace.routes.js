const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/invites/pending', workspaceController.getPendingInvites);
router.get('/:id', workspaceController.getWorkspaceById);
router.patch('/:id', workspaceController.updateWorkspace);
router.post('/:id/invite', workspaceController.inviteMember);
router.post('/:id/accept', workspaceController.acceptInvite);
router.post('/:id/decline', workspaceController.declineInvite);
router.delete('/:id/members/:userId', workspaceController.removeMember);

module.exports = router;