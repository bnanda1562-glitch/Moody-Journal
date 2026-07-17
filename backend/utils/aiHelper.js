const { GoogleGenerativeAI } = require('@google/generative-ai');

// Rule-based fallback analyzer when Gemini API Key is missing or fails
const runFallbackAnalysis = (content, userMood) => {
  const contentLower = content.toLowerCase();
  
  // Default values based on the reported user mood
  let emotion = userMood || 'Neutral';
  let emotionScore = 50;
  let stressLevel = 25;
  let positivityScore = 50;
  let feedback = '';
  let activities = [];
  let quote = '';
  let patterns = 'Initial patterns show steady mood trends.';

  // Mood mappings
  const moodDefaults = {
    Happy: { score: 85, stress: 10, positive: 90, activities: ['Share your joy', 'Call a friend', 'Write down what made you happy'] },
    Neutral: { score: 55, stress: 20, positive: 55, activities: ['Go for a light walk', 'Read a book', 'Plan your tomorrow'] },
    Sad: { score: 25, stress: 40, positive: 20, activities: ['Listen to soothing music', 'Talk to a trusted friend', 'Take a warm bath'] },
    Angry: { score: 20, stress: 80, positive: 15, activities: ['Do some physical exercise', 'Try deep breathing', 'Write down the trigger in detail'] },
    Anxious: { score: 30, stress: 70, positive: 25, activities: ['Try a 5-minute meditation', 'Limit caffeine', 'Grounding exercise (5-4-3-2-1 method)'] },
    Excited: { score: 95, stress: 15, positive: 95, activities: ['Channel energy into a project', 'Celebrate with loved ones', 'Dance to your favorite song'] },
    Tired: { score: 40, stress: 30, positive: 40, activities: ['Take a power nap', 'Drink some water', 'Unplug from screens'] },
    Stressed: { score: 30, stress: 85, positive: 30, activities: ['Prioritize tasks', 'Delegate work', 'Gentle stretching'] }
  };

  const defaults = moodDefaults[emotion] || moodDefaults.Neutral;
  emotionScore = defaults.score;
  stressLevel = defaults.stress;
  positivityScore = defaults.positive;
  activities = [...defaults.activities];

  // Adjust scores based on text contents
  const stressKeywords = ['stress', 'stuck', 'overwhelm', 'deadline', 'pressure', 'hard', 'tired', 'worry', 'panic', 'scared'];
  const happyKeywords = ['happy', 'love', 'great', 'awesome', 'wonderful', 'solved', 'glad', 'smile', 'laugh', 'good'];
  const sadKeywords = ['sad', 'bad', 'cry', 'hurt', 'fail', 'lonely', 'miss', 'broke', 'died', 'regret'];

  let stressCount = 0;
  let happyCount = 0;
  let sadCount = 0;

  stressKeywords.forEach(k => { if (contentLower.includes(k)) stressCount++; });
  happyKeywords.forEach(k => { if (contentLower.includes(k)) happyCount++; });
  sadKeywords.forEach(k => { if (contentLower.includes(k)) sadCount++; });

  // Apply delta
  stressLevel = Math.min(100, Math.max(0, stressLevel + (stressCount * 10) - (happyCount * 5)));
  positivityScore = Math.min(100, Math.max(0, positivityScore + (happyCount * 10) - (sadCount * 10) - (stressCount * 3)));
  emotionScore = Math.min(100, Math.max(0, Math.round((positivityScore + (100 - stressLevel)) / 2)));

  // Generate feedback
  if (stressLevel > 70) {
    feedback = "It sounds like you're carrying a lot of weight today. Remember that it's okay to take things one step at a time and prioritize your peace of mind.";
    quote = "Rule number one is, don't sweat the small stuff. Rule number two is, it's all small stuff. - Richard Carlson";
  } else if (emotionScore < 40) {
    feedback = "I hear you, and it's completely normal to feel low sometimes. Journaling is a beautiful release, and better days lie ahead.";
    quote = "Tough times never last, but tough people do. - Robert H. Schuller";
  } else if (emotionScore > 75) {
    feedback = "What a fantastic entry! Your positive energy radiates through your words. Capitalize on this momentum today.";
    quote = "Keep your face always toward the sunshine - and shadows will fall behind you. - Walt Whitman";
  } else {
    feedback = "Thank you for sharing your thoughts today. Reflecting on your experiences helps build mindfulness and self-awareness.";
    quote = "The unexamined life is not worth living. - Socrates";
  }

  // Detect basic pattern cues
  if (contentLower.includes('work') || contentLower.includes('office') || contentLower.includes('boss')) {
    patterns = 'Workplace contexts seem to be a notable driver of daily reflections.';
  } else if (contentLower.includes('family') || contentLower.includes('mom') || contentLower.includes('dad') || contentLower.includes('friend')) {
    patterns = 'Social relations and family interactions are prominent themes in your notes.';
  } else {
    patterns = 'Reflections are centered around personal routine and inner thoughts.';
  }

  return {
    emotion,
    emotionScore,
    stressLevel,
    positivityScore,
    feedback,
    activities,
    quote,
    patterns
  };
};

// Main function that attempts to query Gemini, falling back to local analysis on error/absence
const analyzeJournalContent = async (content, userMood) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('No GEMINI_API_KEY found, running rule-based fallback analysis...');
    return runFallbackAnalysis(content, userMood);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash for speed and structured outputs
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Analyze the following journal entry text and identify emotional patterns. 
The user has reported their current mood is: "${userMood}".

Journal Content:
"""
${content}
"""

Please reply with a valid JSON object only. Do not wrap in markdown quotes. The JSON object MUST contain the following properties:
{
  "emotion": "A single word summarizing the core emotion (e.g., Happy, Neutral, Sad, Angry, Anxious, Excited, Tired, Stressed)",
  "emotionScore": (an integer between 0 and 100 representing emotional wellbeing, where 100 is excellent/highest positivity and 0 is lowest/depressed),
  "stressLevel": (an integer between 0 and 100 representing perceived stress or pressure level),
  "positivityScore": (an integer between 0 and 100 representing positivity level),
  "feedback": "A short, supportive, compassionate feedback response (2-3 sentences) tailored to the journal entry.",
  "activities": ["An array of 3 specific, actionable activities suggested for the user based on their mood (e.g., Take a walk, Meditate, Exercise, Drink water, Sleep, Write in a diary, Talk to a friend)"],
  "quote": "A motivational or comforting quote relevant to their current emotional state.",
  "patterns": "A brief observation (1 sentence) about recurring emotional triggers or patterns detected from this text."
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // In case the response wraps JSON in markdown block: ```json ... ```
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }

    const jsonAnalysis = JSON.parse(text);
    
    // Validate schema keys
    return {
      emotion: jsonAnalysis.emotion || userMood || 'Neutral',
      emotionScore: typeof jsonAnalysis.emotionScore === 'number' ? jsonAnalysis.emotionScore : 50,
      stressLevel: typeof jsonAnalysis.stressLevel === 'number' ? jsonAnalysis.stressLevel : 30,
      positivityScore: typeof jsonAnalysis.positivityScore === 'number' ? jsonAnalysis.positivityScore : 50,
      feedback: jsonAnalysis.feedback || 'Mindful journaling supports self-improvement.',
      activities: Array.isArray(jsonAnalysis.activities) ? jsonAnalysis.activities : ['Meditate', 'Take a walk'],
      quote: jsonAnalysis.quote || 'Keep moving forward.',
      patterns: jsonAnalysis.patterns || 'Patterns indicate steady self-regulation.'
    };
  } catch (error) {
    console.error('Gemini API analysis failed, using fallback:', error.message);
    return runFallbackAnalysis(content, userMood);
  }
};

module.exports = {
  analyzeJournalContent,
  runFallbackAnalysis
};
