const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

router.get('/adaptive', auth, contentController.getAdaptiveContent);
router.get('/', auth, contentController.getAllContent);
router.post('/', auth, contentController.createContent);
router.put('/:id', auth, isAdmin, contentController.updateContent);
router.delete('/:id', auth, isAdmin, contentController.deleteContent);

module.exports = router;
