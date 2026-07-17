const Journal = require('../models/Journal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const crypto = require('crypto');
const { handleUpload } = require('../middleware/upload');
const { analyzeJournalContent } = require('../utils/aiHelper');
const { generateJournalPDF } = require('../utils/pdfGenerator');

// Socket.IO emitter helper
const emitNotification = (req, userId, notification) => {
  const io = req.app.get('socketio');
  if (io) {
    // Emit notification to user-specific room
    io.to(userId.toString()).emit('new-notification', notification);
  }
};

// Update user streaks and achievements
const updateUserStreak = async (user, req) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastDate = user.lastJournalDate;

  if (lastDate === todayStr) {
    // Already journaled today, no streak increment
    return;
  }

  if (lastDate === yesterdayStr) {
    // Journaled yesterday, increment streak
    user.streakCount += 1;
  } else {
    // Streak broken or new user, set to 1
    user.streakCount = 1;
  }

  // Update longest streak
  if (user.streakCount > user.longestStreak) {
    user.longestStreak = user.streakCount;
  }

  user.lastJournalDate = todayStr;

  // Check achievements
  const newAchievements = [];
  
  if (user.streakCount >= 7 && !user.achievements.includes('7-day-streak')) {
    user.achievements.push('7-day-streak');
    newAchievements.push({
      title: '7-Day Streak Achieved!',
      message: 'You have written a journal for 7 consecutive days! Keep it up.',
      type: 'achievement'
    });
  }

  if (user.streakCount >= 30 && !user.achievements.includes('30-day-streak')) {
    user.achievements.push('30-day-streak');
    newAchievements.push({
      title: '30-Day Streak Master!',
      message: 'Amazing! You maintained a journal streak for 30 days!',
      type: 'achievement'
    });
  }

  // Check total journals count
  const journalCount = await Journal.countDocuments({ userId: user._id, isDraft: false });
  const totalCount = journalCount + 1; // plus this new one being published

  if (totalCount >= 10 && !user.achievements.includes('10-journals')) {
    user.achievements.push('10-journals');
    newAchievements.push({
      title: 'Double Digits!',
      message: 'Congratulations on logging 10 journals!',
      type: 'achievement'
    });
  }

  if (totalCount >= 100 && !user.achievements.includes('100-journals')) {
    user.achievements.push('100-journals');
    newAchievements.push({
      title: 'Centurion Chronicler!',
      message: 'Incredible! You have logged 100 journals!',
      type: 'achievement'
    });
  }

  await user.save();

  // Create notifications and trigger sockets
  for (const ach of newAchievements) {
    const notification = await Notification.create({
      userId: user._id,
      title: ach.title,
      message: ach.message,
      type: ach.type
    });
    emitNotification(req, user._id, notification);
  }
};

// @desc    Create new journal
// @route   POST /api/journals
// @access  Private
exports.createJournal = async (req, res, next) => {
  try {
    const { title, content, mood, tags, isDraft } = req.body;
    let imageUrl = '';

    // Handle image upload if exists
    if (req.file) {
      imageUrl = await handleUpload(req.file);
    }

    // Set default title if empty
    let finalTitle = title;
    if (!finalTitle && content) {
      // AI title generator mock or simple excerpt
      const words = content.trim().split(/\s+/);
      finalTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
    }

    // Run AI analysis
    let analysis = {};
    if (content && isDraft !== 'true') {
      analysis = await analyzeJournalContent(content, mood);
    }

    // Prepare tags array
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Create journal
    const journal = await Journal.create({
      userId: req.user.id,
      title: finalTitle || 'Untitled Journal',
      content: content || '',
      mood: mood || 'Neutral',
      isDraft: isDraft === 'true',
      tags: tagsArray,
      image: imageUrl,
      emotionScore: analysis.emotionScore || 50,
      stressLevel: analysis.stressLevel || 20,
      positivityScore: analysis.positivityScore || 50,
      AIAnalysis: analysis
    });

    // Update streak if not draft
    if (isDraft !== 'true') {
      const user = await User.findById(req.user.id);
      await updateUserStreak(user, req);
    }

    res.status(201).json({
      success: true,
      journal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all user journals
// @route   GET /api/journals
// @access  Private
exports.getJournals = async (req, res, next) => {
  try {
    const { search, mood, tag, fromDate, toDate, isDraft } = req.query;
    
    // Base query
    const query = { userId: req.user.id };

    // Search filters
    if (search) {
      query.$text = { $search: search };
    }

    if (mood) {
      query.mood = mood;
    }

    if (tag) {
      query.tags = tag;
    }

    if (isDraft !== undefined) {
      query.isDraft = isDraft === 'true';
    }

    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // Include the entire day of toDate
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }

    // Execute query sorted by creation date descending
    const journals = await Journal.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: journals.length,
      journals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single journal details
// @route   GET /api/journals/:id
// @access  Private
exports.getJournal = async (req, res, next) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    // Verify ownership
    if (journal.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to access this journal' });
    }

    res.json({
      success: true,
      journal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update journal details
// @route   PUT /api/journals/:id
// @access  Private
exports.updateJournal = async (req, res, next) => {
  try {
    let journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    // Verify ownership
    if (journal.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to update this journal' });
    }

    const { title, content, mood, tags, isDraft } = req.body;

    // Handle new image upload
    if (req.file) {
      const imageUrl = await handleUpload(req.file);
      journal.image = imageUrl;
    }

    // Determine if we need to re-run AI Analysis
    const contentChanged = content !== undefined && content !== journal.content;
    const moodChanged = mood !== undefined && mood !== journal.mood;
    const wasDraft = journal.isDraft;
    const nowPublishing = isDraft === 'false' && wasDraft;

    if (title !== undefined) journal.title = title;
    if (content !== undefined) journal.content = content;
    if (mood !== undefined) journal.mood = mood;
    if (isDraft !== undefined) journal.isDraft = isDraft === 'true';

    if (tags) {
      journal.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Re-run AI analysis if content changed or if publishing a draft
    if ((contentChanged || moodChanged || nowPublishing) && !journal.isDraft) {
      const analysis = await analyzeJournalContent(journal.content, journal.mood);
      journal.emotionScore = analysis.emotionScore || 50;
      journal.stressLevel = analysis.stressLevel || 20;
      journal.positivityScore = analysis.positivityScore || 50;
      journal.AIAnalysis = analysis;
    }

    await journal.save();

    // If it was just published, update the streak
    if (nowPublishing) {
      const user = await User.findById(req.user.id);
      await updateUserStreak(user, req);
    }

    res.json({
      success: true,
      journal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private
exports.deleteJournal = async (req, res, next) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    // Verify ownership
    if (journal.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this journal' });
    }

    await journal.deleteOne();

    res.json({
      success: true,
      message: 'Journal deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate secure private sharing token
// @route   POST /api/journals/share/:id
// @access  Private
exports.generateShareToken = async (req, res, next) => {
  try {
    const journal = await Journal.findById(req.params.id);

    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    if (journal.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Generate unique random token
    journal.shareToken = crypto.randomBytes(16).toString('hex');
    await journal.save();

    res.json({
      success: true,
      shareToken: journal.shareToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get shared journal details
// @route   GET /api/journals/shared/:shareToken
// @access  Public
exports.getSharedJournal = async (req, res, next) => {
  try {
    const journal = await Journal.findOne({ shareToken: req.params.shareToken }).populate('userId', 'name avatar');

    if (!journal) {
      return res.status(404).json({ success: false, error: 'Shared journal not found or link has expired' });
    }

    res.json({
      success: true,
      journal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    React with emoji to journal
// @route   POST /api/journals/:id/react
// @access  Private
exports.reactEmoji = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Please provide an emoji' });
    }

    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    // Find reaction group
    let reaction = journal.emojiReactions.find(r => r.emoji === emoji);

    if (!reaction) {
      // Create reaction group
      journal.emojiReactions.push({
        emoji,
        users: [req.user.id]
      });
    } else {
      // Check if user already reacted with this emoji
      const userIndex = reaction.users.indexOf(req.user.id);
      
      if (userIndex > -1) {
        // Remove reaction (toggle off)
        reaction.users.splice(userIndex, 1);
        // Clean group if no users left
        if (reaction.users.length === 0) {
          journal.emojiReactions = journal.emojiReactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction (toggle on)
        reaction.users.push(req.user.id);
      }
    }

    await journal.save();

    res.json({
      success: true,
      emojiReactions: journal.emojiReactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Single Journal as PDF
// @route   GET /api/journals/export/:id
// @access  Private
exports.exportPDF = async (req, res, next) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ success: false, error: 'Journal not found' });
    }

    // Verify ownership
    if (journal.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to download this journal' });
    }

    generateJournalPDF(journal, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Export Monthly Overview PDF
// @route   GET /api/journals/export-monthly/:monthLabel
// @access  Private
exports.exportMonthlyPDF = async (req, res, next) => {
  try {
    const { monthLabel } = req.params; // e.g. "July 2026"
    
    // Parse year/month
    const [monthName, yearStr] = monthLabel.split(' ');
    const year = parseInt(yearStr);
    const monthsMap = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    
    const monthIndex = monthsMap[monthName];
    if (monthIndex === undefined || isNaN(year)) {
      return res.status(400).json({ success: false, error: 'Invalid month label. Must be e.g. "July 2026"' });
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Get all entries for that month
    const journals = await Journal.find({
      userId: req.user.id,
      isDraft: false,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    if (journals.length === 0) {
      return res.status(404).json({ success: false, error: 'No journals found in this month to export.' });
    }

    const user = await User.findById(req.user.id);
    generateMonthlyReportPDF(journals, monthLabel, user, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Suggest creative title from journal content using Gemini
// @route   POST /api/journals/generate-title
// @access  Private
exports.generateTitle = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Please provide content to generate title' });
    }

    let title = 'Mindful Entry';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Based on the following journal content, suggest a short, creative title (maximum 5 words). Do not include quotes, markdown bolding, or punctuation at the end. Content:\n\n${content}`;
        const result = await model.generateContent(prompt);
        title = result.response.text().trim();
      } catch (err) {
        console.error('Gemini title generation failed, falling back:', err.message);
        const words = content.trim().split(/\s+/);
        title = words.slice(0, 4).join(' ') + ' Reflection';
      }
    } else {
      const words = content.trim().split(/\s+/);
      title = words.slice(0, 4).join(' ') + ' Reflection';
    }

    res.json({ success: true, title });
  } catch (err) {
    next(err);
  }
};
