const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/authMiddleware');

// All routes are protected
router.post('/', auth, groupController.create);
router.post('/join', auth, groupController.join);
router.get('/my', auth, groupController.getMyGroup);

module.exports = router;
