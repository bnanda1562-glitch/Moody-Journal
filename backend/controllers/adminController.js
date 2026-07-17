const User = require('../models/User');
const Journal = require('../models/Journal');
const VoiceJournal = require('../models/VoiceJournal');
const Tracker = require('../models/Tracker');
const Notification = require('../models/Notification');

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ joinedAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a specific user and all associated records
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete admin accounts' });
    }

    // Cascade delete all user records
    const userId = user._id;
    await Journal.deleteMany({ userId });
    await VoiceJournal.deleteMany({ userId });
    await Tracker.deleteMany({ userId });
    await Notification.deleteMany({ userId });
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User and all associated journal logs deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get platform-wide aggregate statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalJournals = await Journal.countDocuments({ isDraft: false });
    
    // Average mood/happiness across all journals
    const moodAgg = await Journal.aggregate([
      { $match: { isDraft: false } },
      { $group: { _id: null, avgEmotion: { $avg: '$emotionScore' } } }
    ]);
    
    const averageMood = moodAgg.length > 0 ? Math.round(moodAgg[0].avgEmotion) : 50;

    // Most active users (by published journal count)
    const activeUsersAgg = await Journal.aggregate([
      { $match: { isDraft: false } },
      { $group: { _id: '$userId', journalCount: { $sum: 1 } } },
      { $sort: { journalCount: -1 } },
      { $limit: 5 }
    ]);

    // Populate user info manually to avoid complex joins in agg (simpler code)
    const mostActiveUsers = [];
    for (const item of activeUsersAgg) {
      const userData = await User.findById(item._id).select('name email avatar joinedAt');
      if (userData) {
        mostActiveUsers.push({
          user: userData,
          journalCount: item.journalCount
        });
      }
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalJournals,
        averageMood,
        mostActiveUsers
      }
    });
  } catch (err) {
    next(err);
  }
};
