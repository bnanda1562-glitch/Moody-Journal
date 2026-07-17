const express = require('express');
const router = express.Router();
const { getAIInsights } = require('../controllers/insightsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAIInsights);

module.exports = router;
