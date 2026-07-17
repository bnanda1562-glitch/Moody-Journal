const mongoose = require('mongoose');

const VoiceJournalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioUrl: {
    type: String,
    required: [true, 'Please provide an audio recording URL or identifier']
  },
  transcript: {
    type: String,
    required: [true, 'Please provide the speech-to-text transcript']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

VoiceJournalSchema.index({ userId: 1, createdAt: -1 });

const VoiceJournalModel = mongoose.model('VoiceJournal', VoiceJournalSchema);
module.exports = require('../config/proxyModel')('VoiceJournal', VoiceJournalModel);
