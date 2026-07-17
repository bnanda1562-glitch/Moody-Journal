const express = require('express');
const router = express.Router();
const {
  getTrackers,
  logWater,
  logSleep,
  logPomodoro,
  updateHabit,
  updateGoal
} = require('../controllers/trackerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getTrackers);
router.post('/water', logWater);
router.post('/sleep', logSleep);
router.post('/pomodoro', logPomodoro);
router.post('/habit', updateHabit);
router.post('/goal', updateGoal);

module.exports = router;
