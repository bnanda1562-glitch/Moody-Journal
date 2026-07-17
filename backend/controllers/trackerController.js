const Tracker = require('../models/Tracker');

// Helper to get or create a tracker for a user on a specific date
const getOrCreateTracker = async (userId, date) => {
  let tracker = await Tracker.findOne({ userId, date });
  
  if (!tracker) {
    // Create defaults
    const defaultHabits = [
      { habitName: 'Drink 2L Water', completed: false },
      { habitName: 'Meditate 10 mins', completed: false },
      { habitName: 'Read a book', completed: false },
      { habitName: 'Go for a walk', completed: false }
    ];

    tracker = await Tracker.create({
      userId,
      date,
      habits: defaultHabits,
      goals: []
    });
  }
  
  return tracker;
};

// @desc    Get tracker logs for a specific date
// @route   GET /api/trackers
// @access  Private
exports.getTrackers = async (req, res, next) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);
    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};

// @desc    Update/log water intake
// @route   POST /api/trackers/water
// @access  Private
exports.logWater = async (req, res, next) => {
  try {
    const { date, amount } = req.body; // amount is relative change, e.g. +250 or -250
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);
    tracker.waterIntake = Math.max(0, tracker.waterIntake + parseInt(amount || 250));
    await tracker.save();

    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};

// @desc    Update/log sleep hours
// @route   POST /api/trackers/sleep
// @access  Private
exports.logSleep = async (req, res, next) => {
  try {
    const { date, hours } = req.body;
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);
    tracker.sleepHours = Math.max(0, parseFloat(hours || 0));
    await tracker.save();

    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};

// @desc    Log a pomodoro session
// @route   POST /api/trackers/pomodoro
// @access  Private
exports.logPomodoro = async (req, res, next) => {
  try {
    const { date } = req.body;
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);
    tracker.pomodoroSessions += 1;
    await tracker.save();

    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};

// @desc    Add or toggle completion of a habit
// @route   POST /api/trackers/habit
// @access  Private
exports.updateHabit = async (req, res, next) => {
  try {
    const { date, habitName, completed, action } = req.body; // action: 'add', 'toggle', 'delete'
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);

    if (action === 'add') {
      if (habitName) {
        tracker.habits.push({ habitName, completed: false });
      }
    } else if (action === 'delete') {
      tracker.habits = tracker.habits.filter(h => h.habitName !== habitName);
    } else if (action === 'toggle') {
      const habit = tracker.habits.find(h => h.habitName === habitName);
      if (habit) {
        habit.completed = completed;
      }
    }

    await tracker.save();
    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};

// @desc    Add or toggle completion of a goal
// @route   POST /api/trackers/goal
// @access  Private
exports.updateGoal = async (req, res, next) => {
  try {
    const { date, goalName, completed, action } = req.body; // action: 'add', 'toggle', 'delete'
    const searchDate = date || new Date().toISOString().split('T')[0];

    const tracker = await getOrCreateTracker(req.user.id, searchDate);

    if (action === 'add') {
      if (goalName) {
        tracker.goals.push({ goalName, completed: false });
      }
    } else if (action === 'delete') {
      tracker.goals = tracker.goals.filter(g => g.goalName !== goalName);
    } else if (action === 'toggle') {
      const goal = tracker.goals.find(g => g.goalName === goalName);
      if (goal) {
        goal.completed = completed;
      }
    }

    await tracker.save();
    res.json({ success: true, tracker });
  } catch (err) {
    next(err);
  }
};
