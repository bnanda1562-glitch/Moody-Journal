const Journal = require('../models/Journal');
const Tracker = require('../models/Tracker');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Generate rule-based fallback wellness insights
const getFallbackInsights = (journals, trackers) => {
  let totalEmotion = 0;
  let totalStress = 0;
  let totalPositivity = 0;
  const moodCounts = {};
  const dayOfWeekStress = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
  const dayOfWeekCount = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  journals.forEach(j => {
    totalEmotion += j.emotionScore || 50;
    totalStress += j.stressLevel || 0;
    totalPositivity += j.positivityScore || 50;
    
    // Track by mood
    moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    
    // Group by weekday
    const dayName = weekdayNames[new Date(j.createdAt).getDay()];
    dayOfWeekStress[dayName].push(j.stressLevel || 0);
    dayOfWeekCount[dayName] += 1;
  });

  const count = journals.length || 1;
  const avgHappiness = Math.round(totalEmotion / count);
  const avgStress = Math.round(totalStress / count);
  const avgPositivity = Math.round(totalPositivity / count);

  // Wellness score formula: positivity weighted heavily, penalized by stress
  const wellnessScore = Math.min(100, Math.max(0, Math.round((avgPositivity * 0.6) + ((100 - avgStress) * 0.4))));

  // Most common emotion
  let mostCommonEmotion = 'Neutral';
  let maxMoodCount = 0;
  Object.keys(moodCounts).forEach(m => {
    if (moodCounts[m] > maxMoodCount) {
      maxMoodCount = moodCounts[m];
      mostCommonEmotion = m;
    }
  });

  // Calculate most stressful day
  let mostStressfulDay = 'Monday';
  let highestAvgStress = -1;
  Object.keys(dayOfWeekStress).forEach(day => {
    const list = dayOfWeekStress[day];
    if (list.length > 0) {
      const avg = list.reduce((a, b) => a + b, 0) / list.length;
      if (avg > highestAvgStress) {
        highestAvgStress = avg;
        mostStressfulDay = day;
      }
    }
  });

  // Calculate most active day
  let mostActiveDay = 'Sunday';
  let maxActiveCount = -1;
  Object.keys(dayOfWeekCount).forEach(day => {
    if (dayOfWeekCount[day] > maxActiveCount) {
      maxActiveCount = dayOfWeekCount[day];
      mostActiveDay = day;
    }
  });

  // Generate reflective text
  let weeklySummary = 'Your logs show steady emotional balance. Journaling regularly is building mindfulness.';
  let monthlySummary = 'Over the last 30 days, you have actively cataloged your emotional states. Keep observing triggers.';
  let advice = [];
  let habits = { positive: [], negative: [] };

  if (wellnessScore > 75) {
    weeklySummary = 'An outstanding week of high mental wellness! Your logs reflect clarity, high positivity, and robust self-reflection.';
    monthlySummary = 'This month, your emotional resilience was exceptional. Positive habits and steady mood levels were sustained.';
    advice = [
      'Celebrate your achievements this week to lock in your positive habits.',
      'Consider sharing your upbeat momentum with friends or family.',
      'Continue logging entries at similar times to keep your journal streak active.'
    ];
    habits.positive = ['Daily mindfulness reflection', 'Regular emotional documentation'];
    habits.negative = ['None detected'];
  } else if (avgStress > 60) {
    weeklySummary = 'You experienced elevated stress levels recently. Your journals focus on work pressure or fatigue.';
    monthlySummary = 'This month marked high-pressure points. Tracking these shows they occur in cycles, particularly mid-week.';
    advice = [
      'Take regular micro-breaks of 5-10 minutes during high-stress hours.',
      'Set clear boundaries to disconnect from work after hours.',
      'Try progressive muscle relaxation or box breathing when anxiety spikes.'
    ];
    habits.positive = ['Identifying stress triggers through writing'];
    habits.negative = ['Over-scheduling tasks', 'Ignoring signs of mental burnout'];
  } else {
    weeklySummary = 'Your week showed a normal emotional curve with a balance of neutral and happy moments.';
    advice = [
      'Drink plenty of water and maintain 7-8 hours of sleep.',
      'Log even minor achievements; they reinforce self-worth.',
      'Try a gentle physical workout to boost endorphins.'
    ];
    habits.positive = ['Self-awareness exercises'];
    habits.negative = ['Slightly irregular sleep cycles'];
  }

  return {
    wellnessScore,
    mostCommonEmotion,
    mostActiveDay,
    mostStressfulDay,
    weeklySummary,
    monthlySummary,
    advice,
    positiveHabits: habits.positive,
    negativeHabits: habits.negative,
    recommendations: ['Practice deep breathing', 'Drink 2L water', 'Take a 15-minute nature walk']
  };
};

// @desc    Get AI Insights and overall Wellness Analysis
// @route   GET /api/insights
// @access  Private
exports.getAIInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Fetch last 30 days published journals
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const journals = await Journal.find({
      userId,
      isDraft: false,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    const trackers = await Tracker.find({
      userId,
      date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
    });

    const fallback = getFallbackInsights(journals, trackers);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || journals.length === 0) {
      // Return standard insights if API key is missing or no entries exist
      return res.json({
        success: true,
        insights: fallback
      });
    }

    // If API Key is present, query Gemini for aggregated insights
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Compile journal inputs
      const journalSnippets = journals.slice(0, 10).map(j => (
        `Date: ${new Date(j.createdAt).toISOString().split('T')[0]}, Mood: ${j.mood}, Content: "${j.content.substring(0, 300)}"`
      )).join('\n\n');

      const prompt = `
You are an expert mental wellness assistant. Analyze the user's recent journal entries over the last 30 days and provide comprehensive insights.

Here are the journal entries:
${journalSnippets}

Based on these entries:
1. Compute a "wellnessScore" (0-100 index).
2. Identify "mostCommonEmotion" (one word).
3. Draft a "weeklySummary" (2-3 sentences detailing their emotional patterns last week).
4. Draft a "monthlySummary" (2-3 sentences detailing overall trends).
5. Compile an array of 3 personalized "advice" items.
6. Detect 1-2 "positiveHabits" the user exhibits.
7. Detect 1-2 "negativeHabits" or stress triggers.
8. Suggest 3 specific "recommendations" (e.g. mindfulness exercises, habits).

Return a valid JSON object ONLY. Do not wrap in markdown quotes.
Format:
{
  "wellnessScore": number,
  "mostCommonEmotion": "string",
  "weeklySummary": "string",
  "monthlySummary": "string",
  "advice": ["advice 1", "advice 2", "advice 3"],
  "positiveHabits": ["habit 1", "habit 2"],
  "negativeHabits": ["habit 1", "habit 2"],
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}
`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3).trim();
      }

      const parsed = JSON.parse(text);

      res.json({
        success: true,
        insights: {
          wellnessScore: parsed.wellnessScore || fallback.wellnessScore,
          mostCommonEmotion: parsed.mostCommonEmotion || fallback.mostCommonEmotion,
          mostActiveDay: fallback.mostActiveDay,
          mostStressfulDay: fallback.mostStressfulDay,
          weeklySummary: parsed.weeklySummary || fallback.weeklySummary,
          monthlySummary: parsed.monthlySummary || fallback.monthlySummary,
          advice: parsed.advice || fallback.advice,
          positiveHabits: parsed.positiveHabits || fallback.positiveHabits,
          negativeHabits: parsed.negativeHabits || fallback.negativeHabits,
          recommendations: parsed.recommendations || fallback.recommendations
        }
      });
    } catch (apiErr) {
      console.error('Gemini insights generation failed, using fallback:', apiErr.message);
      res.json({
        success: true,
        insights: fallback
      });
    }
  } catch (err) {
    next(err);
  }
};
