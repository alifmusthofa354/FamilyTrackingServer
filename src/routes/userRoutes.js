const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware'); // Import middleware

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, userController.getProfile);

// @route   PUT api/users/me
// @desc    Update current user profile (name, email, password)
// @access  Private
router.put('/me', auth, userController.updateProfile);

// @route   DELETE api/users/me
// @desc    Delete current user account
// @access  Private
router.delete('/me', auth, userController.deleteAccount);

const mult = require('multer');
// Memory storage handles file processing in memory buffers before uploading to Supabase
const upload = mult({
    storage: mult.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// @route   POST api/users/upload-photo
// @desc    Upload profile picture
// @access  Private
router.post('/upload-photo', auth, upload.single('photo'), userController.uploadPhoto);

module.exports = router;
