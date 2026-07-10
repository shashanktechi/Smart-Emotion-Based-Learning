const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.get('/users', auth, isAdmin, authController.getAllUsers);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/users/:id/password', auth, isAdmin, authController.adminChangePassword);

module.exports = router;
