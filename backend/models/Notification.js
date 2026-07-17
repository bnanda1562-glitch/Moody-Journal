const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['reminder', 'streak', 'achievement', 'general'],
    default: 'general'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

const NotificationModel = mongoose.model('Notification', NotificationSchema);
module.exports = require('../config/proxyModel')('Notification', NotificationModel);
