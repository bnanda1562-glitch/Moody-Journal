// Test script to run backend AI helper and verify fallbacks
const { runFallbackAnalysis, analyzeJournalContent } = require('../utils/aiHelper');

console.log('--- Testing Mood Journal AI Helper ---');

// Test 1: Fallback analysis check
console.log('\nTest 1: Running Rule-Based Fallback Sentiment Analysis...');
const contentText = "Today was a really stressful day at the office. My boss piled on two extra deadlines and I felt completely overwhelmed and tired. However, I managed to take a short walk at lunch which helped a tiny bit.";
const reportedMood = "Stressed";

const fallbackResults = runFallbackAnalysis(contentText, reportedMood);
console.log('Fallback Results:');
console.log(JSON.stringify(fallbackResults, null, 2));

// Verify that keys are properly returned
if (
  fallbackResults.emotion === 'Stressed' &&
  typeof fallbackResults.emotionScore === 'number' &&
  fallbackResults.stressLevel > 70 &&
  Array.isArray(fallbackResults.activities) &&
  fallbackResults.quote
) {
  console.log('✅ Test 1 Passed: Fallback analysis matches expected schema and values.');
} else {
  console.error('❌ Test 1 Failed: Fallback analysis structure mismatch.');
}

// Test 2: Gemini API connector check
console.log('\nTest 2: Checking Gemini API connection status...');
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ No GEMINI_API_KEY set in environment. Skipping active API network tests. App will run in fallback mode.');
} else {
  console.log('GEMINI_API_KEY is defined. Attempting network execution...');
  analyzeJournalContent(contentText, reportedMood).then((res) => {
    console.log('Gemini Analysis Results:');
    console.log(JSON.stringify(res, null, 2));
    console.log('✅ Test 2 Passed: Successfully fetched active AI insights.');
  }).catch((err) => {
    console.error('❌ Test 2 Failed:', err.message);
  });
}
