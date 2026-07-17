const express = require('express');
const router = express.Router();
const {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  generateShareToken,
  getSharedJournal,
  reactEmoji,
  exportPDF,
  exportMonthlyPDF,
  generateTitle
} = require('../controllers/journalController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public route for viewing shared journals
router.get('/shared/:shareToken', getSharedJournal);

// Protected routes
router.use(protect);

router.post('/generate-title', generateTitle);

router.route('/')
  .post(upload.single('image'), createJournal)
  .get(getJournals);

router.route('/:id')
  .get(getJournal)
  .put(upload.single('image'), updateJournal)
  .delete(deleteJournal);

router.post('/share/:id', generateShareToken);
router.post('/:id/react', reactEmoji);

router.get('/export/:id', exportPDF);
router.get('/export-monthly/:monthLabel', exportMonthlyPDF);

module.exports = router;
