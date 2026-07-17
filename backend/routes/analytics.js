const express = require('express');
const router = express.Router();
const { getAnalyticsData } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAnalyticsData);

module.exports = router;
