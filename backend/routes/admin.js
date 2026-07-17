const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, getPlatformStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/stats', getPlatformStats);

module.exports = router;
