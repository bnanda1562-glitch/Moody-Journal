const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add journal content']
  },
  mood: {
    type: String,
    required: [true, 'Please select a mood'],
    enum: ['Happy', 'Neutral', 'Sad', 'Angry', 'Anxious', 'Excited', 'Tired', 'Stressed']
  },
  emotionScore: {
    type: Number, // 0 to 100
    default: 50
  },
  stressLevel: {
    type: Number, // 0 to 100
    default: 0
  },
  positivityScore: {
    type: Number, // 0 to 100
    default: 50
  },
  tags: {
    type: [String],
    default: []
  },
  image: {
    type: String,
    default: ''
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    default: null
  },
  emojiReactions: [
    {
      emoji: String, // e.g. "❤️", "👍", "😮"
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
  ],
  AIAnalysis: {
    emotion: String,
    emotionScore: Number,
    stressLevel: Number,
    positivityScore: Number,
    feedback: String,
    activities: [String],
    quote: String,
    patterns: String,
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster search and filtering
JournalSchema.index({ userId: 1, createdAt: -1 });
JournalSchema.index({ tags: 1 });
JournalSchema.index({ mood: 1 });
JournalSchema.index({ shareToken: 1 });
// Text index for search functionality
JournalSchema.index({ title: 'text', content: 'text' });

const JournalModel = mongoose.model('Journal', JournalSchema);
module.exports = require('../config/proxyModel')('Journal', JournalModel);
