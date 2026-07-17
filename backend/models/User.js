const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  streakCount: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastJournalDate: {
    type: String, // Stored as YYYY-MM-DD
    default: ''
  },
  achievements: {
    type: [String], // Array of keys: '7-day-streak', '30-day-streak', '100-journals', etc.
    default: []
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel = mongoose.model('User', UserSchema);
module.exports = require('../config/proxyModel')('User', UserModel);
