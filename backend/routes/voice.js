const express = require('express');
const router = express.Router();
const { saveVoiceJournal } = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, upload.single('audio'), saveVoiceJournal);

module.exports = router;
