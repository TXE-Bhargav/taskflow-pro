const express = require('express');
const router = express.Router({ mergeParams: true }); 
// mergeParams: true → allows access to :workspaceId from parent route

const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/',    projectController.createProject);
router.get('/',     projectController.getProjects);
router.get('/:id',  projectController.getProjectById);
router.put('/:id',  projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;