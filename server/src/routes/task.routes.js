const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/project/:projectId',   taskController.createTask);
router.get('/project/:projectId',    taskController.getTasksByProject);
router.get('/:id',                   taskController.getTaskById);
router.put('/:id',                   taskController.updateTask);
router.patch('/:id/move',            taskController.moveTask);
router.delete('/:id',                taskController.deleteTask);
router.post('/:id/comments',         taskController.addComment);
router.post('/:id/labels',           taskController.addLabel);
router.delete('/:id/labels',         taskController.removeLabel);

module.exports = router;