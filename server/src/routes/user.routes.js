const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

router.use(protect);

router.patch('/profile', userController.updateProfile);
router.get('/profile', userController.getProfile);

module.exports = router;