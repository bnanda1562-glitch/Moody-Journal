const VoiceJournal = require('../models/VoiceJournal');
const { handleUpload } = require('../middleware/upload');

// @desc    Upload voice journal audio + transcript
// @route   POST /api/voice
// @access  Private
exports.saveVoiceJournal = async (req, res, next) => {
  try {
    const { transcript } = req.body;
    let audioUrl = '';

    if (!transcript) {
      return res.status(400).json({ success: false, error: 'Please provide a transcript' });
    }

    if (req.file) {
      audioUrl = await handleUpload(req.file);
    } else {
      // In case speech is recorded via Web Speech API and no audio file is uploaded,
      // we can save the transcript and save a mock reference URL.
      audioUrl = `voice-dictation-ref-${Date.now()}`;
    }

    const voiceJournal = await VoiceJournal.create({
      userId: req.user.id,
      audioUrl,
      transcript
    });

    res.status(201).json({
      success: true,
      voiceJournal
    });
  } catch (err) {
    next(err);
  }
};
