const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;
