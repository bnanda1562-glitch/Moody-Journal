const Journal = require('../models/Journal');
const Tracker = require('../models/Tracker');

// @desc    Get emotional analytics and tracker statistics
// @route   GET /api/analytics
// @access  Private
exports.getAnalyticsData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch published journals from last 30 days
    const journals = await Journal.find({
      userId,
      isDraft: false,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    const totalJournals = await Journal.countDocuments({ userId, isDraft: false });

    // 1. Daily Mood Line Chart Data (Last 15 days of entries)
    const last15DaysEntries = journals.slice(-15);
    const dailyMoodLine = last15DaysEntries.map(j => ({
      date: new Date(j.createdAt).toISOString().split('T')[0], // Format: YYYY-MM-DD
      score: j.emotionScore || 50,
      title: j.title,
      mood: j.mood
    }));

    // 2. Weekly Emotion Bar Chart Data (Last 7 days average stress vs positivity vs happiness)
    // We can group journals by weekday (e.g. Mon, Tue, etc.)
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyDataMap = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = weekdayNames[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      weeklyDataMap[dateStr] = {
        day: dayName,
        happiness: 0,
        stress: 0,
        positivity: 0,
        count: 0
      };
    }

journals.forEach(j => {
      // 1. Skip if createdAt is missing to prevent "Invalid Date" crashes
      if (!j.createdAt) return;

      // 2. Convert the incoming string/timestamp back into a Date object
      const dateObject = new Date(j.createdAt);
      
      // 3. Extract the YYYY-MM-DD format
      const dateStr = dateObject.toISOString().split('T')[0];
      
      if (weeklyDataMap[dateStr]) {
        weeklyDataMap[dateStr].happiness += j.emotionScore || 50;
        weeklyDataMap[dateStr].stress += j.stressLevel || 0;
        weeklyDataMap[dateStr].positivity += j.positivityScore || 50;
        weeklyDataMap[dateStr].count += 1;
      }
    });

    const weeklyTrends = Object.values(weeklyDataMap).map(dayObj => ({
      day: dayObj.day,
      happiness: dayObj.count > 0 ? Math.round(dayObj.happiness / dayObj.count) : 50,
      stress: dayObj.count > 0 ? Math.round(dayObj.stress / dayObj.count) : 0,
      positivity: dayObj.count > 0 ? Math.round(dayObj.positivity / dayObj.count) : 50
    }));

    // 3. Monthly Mood Pie Chart (Frequencies of mood emojis/strings)
    const moodFrequency = {
      Happy: 0,
      Neutral: 0,
      Sad: 0,
      Angry: 0,
      Anxious: 0,
      Excited: 0,
      Tired: 0,
      Stressed: 0
    };

    journals.forEach(j => {
      if (moodFrequency[j.mood] !== undefined) {
        moodFrequency[j.mood] += 1;
      }
    });

    // 4. Mood Heatmap (Contributions grid: last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const yearlyJournals = await Journal.find({
      userId,
      isDraft: false,
      createdAt: { $gte: oneYearAgo }
    }).select('createdAt emotionScore mood');

    const heatmapData = yearlyJournals.map(j => ({
      date: new Date(j.createdAt).toISOString().split('T')[0],
      score: j.emotionScore || 50,
      mood: j.mood
    }));

    // 5. Compute general wellness statistics
    let sumHappiness = 0;
    let sumStress = 0;
    let sumPositivity = 0;
    
    journals.forEach(j => {
      sumHappiness += j.emotionScore || 50;
      sumStress += j.stressLevel || 0;
      sumPositivity += j.positivityScore || 50;
    });

    const avgHappiness = journals.length > 0 ? Math.round(sumHappiness / journals.length) : 50;
    const avgStress = journals.length > 0 ? Math.round(sumStress / journals.length) : 0;
    const avgPositivity = journals.length > 0 ? Math.round(sumPositivity / journals.length) : 50;

    // Fetch tracker stats for water/sleep averages
    const trackers = await Tracker.find({
      userId,
      date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
    });

    let totalWater = 0;
    let totalSleep = 0;
    let sleepDaysCount = 0;
    let waterDaysCount = 0;

    trackers.forEach(t => {
      if (t.waterIntake > 0) {
        totalWater += t.waterIntake;
        waterDaysCount++;
      }
      if (t.sleepHours > 0) {
        totalSleep += t.sleepHours;
        sleepDaysCount++;
      }
    });

    const avgWater = waterDaysCount > 0 ? Math.round(totalWater / waterDaysCount) : 0;
    const avgSleep = sleepDaysCount > 0 ? Math.round((totalSleep / sleepDaysCount) * 10) / 10 : 0;

    res.json({
      success: true,
      stats: {
        totalJournals,
        avgHappiness,
        avgStress,
        avgPositivity,
        avgWater,
        avgSleep
      },
      dailyMoodLine,
      weeklyTrends,
      moodFrequency,
      heatmapData
    });
  } catch (err) {
    next(err);
  }
};
