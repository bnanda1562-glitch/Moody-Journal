const mongoose = require('mongoose');

const TrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true
  },
  waterIntake: {
    type: Number, // in ml
    default: 0
  },
  sleepHours: {
    type: Number, // in hours
    default: 0
  },
  pomodoroSessions: {
    type: Number, // count
    default: 0
  },
  habits: [
    {
      habitName: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  goals: [
    {
      goalName: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ]
});

// Compound index to ensure a unique entry per user per day
TrackerSchema.index({ userId: 1, date: 1 }, { unique: true });

const TrackerModel = mongoose.model('Tracker', TrackerSchema);
module.exports = require('../config/proxyModel')('Tracker', TrackerModel);
