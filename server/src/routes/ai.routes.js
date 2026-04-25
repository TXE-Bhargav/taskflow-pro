// ai.routes.js — All AI feature endpoints
// All routes protected — must be logged in to use AI features

const express      = require('express');
const router       = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect }  = require('../middleware/auth.middleware');

router.use(protect);

// POST /api/ai/breakdown      → Break goal into subtasks
// POST /api/ai/suggest-date   → Suggest due date for a task
// POST /api/ai/improve        → Improve task description
// GET  /api/ai/standup        → Generate daily standup
// GET  /api/ai/prioritize/:projectId → Prioritize project tasks

router.post('/breakdown',              aiController.breakdownTask);
router.post('/suggest-date',           aiController.suggestDueDate);
router.post('/improve',                aiController.improveDescription);
router.get('/standup',                 aiController.generateStandup);
router.get('/prioritize/:projectId',   aiController.prioritizeTasks);

module.exports = router;