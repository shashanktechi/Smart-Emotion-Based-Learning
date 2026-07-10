const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.post('/', auth, analyticsController.logEmotion);
router.get('/dashboard', auth, analyticsController.getDashboardStats);
router.get('/admin/summary', auth, isAdmin, analyticsController.getAdminSummary);

module.exports = router;
