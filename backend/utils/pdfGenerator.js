const PDFDocument = require('pdfkit');

/**
 * Generates a PDF for a single journal entry and sends it directly to the response stream.
 */
const generateJournalPDF = (journal, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream PDF to Express Response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=journal-${journal._id}.pdf`);
  doc.pipe(res);

  // Background and Accent Colors
  const purpleAccent = '#8B5CF6';
  const darkSlate = '#1F2937';
  const lightGray = '#F9FAFB';

  // --- Header Section ---
  doc.fillColor(purpleAccent).fontSize(26).font('Helvetica-Bold').text('Mood Journal AI', { align: 'center' });
  doc.fillColor(darkSlate).fontSize(12).font('Helvetica').text('Your Intelligent Emotional Companion', { align: 'center' });
  doc.moveDown(1.5);

  // Divider Line
  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(1.5);

  // --- Journal Meta Info ---
  doc.fillColor(darkSlate).fontSize(20).font('Helvetica-Bold').text(journal.title);
  doc.moveDown(0.3);

  const formattedDate = new Date(journal.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.fillColor('#6B7280').fontSize(10).font('Helvetica').text(`Recorded on ${formattedDate}`);
  doc.fillColor(purpleAccent).fontSize(11).font('Helvetica-Bold').text(`Mood: ${journal.mood}`);
  
  if (journal.tags && journal.tags.length > 0) {
    doc.fillColor('#3B82F6').fontSize(10).font('Helvetica-Oblique').text(`Tags: ${journal.tags.join(', ')}`);
  }
  doc.moveDown(1.5);

  // --- Journal Content Section ---
  doc.fillColor(darkSlate).fontSize(12).font('Helvetica').text(journal.content, {
    align: 'left',
    lineGap: 4
  });
  doc.moveDown(2);

  // --- AI Insights Section (If available) ---
  if (journal.AIAnalysis && journal.AIAnalysis.feedback) {
    // Add a shaded box for AI Insights
    const boxStartY = doc.y;
    doc.rect(50, boxStartY, 512, 180)
       .fillColor(lightGray)
       .strokeColor('#D8B4FE')
       .lineWidth(1)
       .fillAndStroke();

    doc.fillColor(purpleAccent).fontSize(14).font('Helvetica-Bold').text('AI Emotional Analysis', 65, boxStartY + 15);
    doc.moveDown(0.5);

    // Scores row
    const scoreY = doc.y;
    doc.fillColor(darkSlate).fontSize(10).font('Helvetica-Bold').text(`Emotional Score: ${journal.AIAnalysis.emotionScore || journal.emotionScore}/100`, 65, scoreY);
    doc.text(`Stress Level: ${journal.AIAnalysis.stressLevel || journal.stressLevel}/100`, 220, scoreY);
    doc.text(`Positivity Score: ${journal.AIAnalysis.positivityScore || journal.positivityScore}/100`, 360, scoreY);
    doc.moveDown(1.2);

    // Feedback
    doc.fillColor(darkSlate).fontSize(10).font('Helvetica').text(`Feedback: "${journal.AIAnalysis.feedback}"`, 65, doc.y, { width: 480, lineGap: 3 });
    doc.moveDown(1);

    // Activities
    if (journal.AIAnalysis.activities && journal.AIAnalysis.activities.length > 0) {
      doc.font('Helvetica-Bold').text('Suggested Activities: ', 65, doc.y);
      doc.font('Helvetica').text(journal.AIAnalysis.activities.join(', '), 195, doc.y - 12); // align text beside label
      doc.moveDown(1);
    }

    // Quote
    if (journal.AIAnalysis.quote) {
      doc.font('Helvetica-Oblique').fillColor('#4B5563').text(`"${journal.AIAnalysis.quote}"`, 65, doc.y, { align: 'center', width: 480 });
    }
  }

  // Finalize PDF
  doc.end();
};

/**
 * Generates a monthly summary report PDF and pipes it to the HTTP response.
 */
const generateMonthlyReportPDF = (journals, monthLabel, user, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${monthLabel.replace(/\s+/g, '-')}.pdf`);
  doc.pipe(res);

  const purpleAccent = '#8B5CF6';
  const darkSlate = '#1F2937';
  const lightGray = '#F9FAFB';

  // --- Header ---
  doc.fillColor(purpleAccent).fontSize(24).font('Helvetica-Bold').text('Mood Journal AI', { align: 'center' });
  doc.fillColor(darkSlate).fontSize(14).font('Helvetica').text(`Monthly Emotional Health Report - ${monthLabel}`, { align: 'center' });
  doc.fontSize(10).text(`Prepared for: ${user.name} (${user.email})`, { align: 'center' });
  doc.moveDown(1.5);

  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(1.5);

  // --- Aggregate Statistics Calculations ---
  const totalEntries = journals.length;
  if (totalEntries === 0) {
    doc.fillColor(darkSlate).fontSize(14).text('No journal entries found for this month.', { align: 'center' });
    doc.end();
    return;
  }

  let totalEmotion = 0;
  let totalStress = 0;
  let totalPositivity = 0;
  const moodCounts = {};

  journals.forEach(j => {
    totalEmotion += j.emotionScore || 50;
    totalStress += j.stressLevel || 0;
    totalPositivity += j.positivityScore || 50;
    moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
  });

  const avgEmotion = Math.round(totalEmotion / totalEntries);
  const avgStress = Math.round(totalStress / totalEntries);
  const avgPositivity = Math.round(totalPositivity / totalEntries);

  // Find most common mood
  let primaryMood = 'None';
  let maxCount = 0;
  Object.keys(moodCounts).forEach(m => {
    if (moodCounts[m] > maxCount) {
      maxCount = moodCounts[m];
      primaryMood = m;
    }
  });

  // --- Statistics Box ---
  doc.fillColor(darkSlate).fontSize(16).font('Helvetica-Bold').text('Monthly Metrics Summary');
  doc.moveDown(0.5);

  const boxY = doc.y;
  doc.rect(50, boxY, 512, 100)
     .fillColor(lightGray)
     .strokeColor('#E5E7EB')
     .lineWidth(1)
     .fillAndStroke();

  doc.fillColor(darkSlate).fontSize(11).font('Helvetica-Bold');
  doc.text(`Total Journals Logged: ${totalEntries}`, 70, boxY + 15);
  doc.text(`Primary Emotion: ${primaryMood} (Logged ${maxCount} times)`, 70, boxY + 35);
  doc.text(`Average Happiness Index: ${avgEmotion}/100`, 70, boxY + 55);
  doc.text(`Average Stress Level: ${avgStress}/100`, 310, boxY + 15);
  doc.text(`Average Positivity Score: ${avgPositivity}/100`, 310, boxY + 35);
  doc.moveDown(3);

  // --- Reflections Summary section ---
  doc.fontSize(16).font('Helvetica-Bold').text('AI Generated Monthly Reflections');
  doc.moveDown(0.5);
  
  // Custom feedback text based on stats
  let summaryReflection = '';
  if (avgEmotion > 70 && avgStress < 30) {
    summaryReflection = "You experienced a highly positive and balanced month. Keep cultivating the supportive habits that are feeding this sense of mental wellness. Focus on tracking what brought you joy this month and duplicate it.";
  } else if (avgStress > 60) {
    summaryReflection = "This month showed elevated stress indicators. It is vital to incorporate more frequent boundaries, mindfulness breaks, and self-care routines. Remember that journaling is a great outlet, but seeking personal support when overloaded is healthy.";
  } else {
    summaryReflection = "Your emotional trends remained highly stable this month, reflecting a healthy balance of peaks and valleys. Continuing to track your moods daily will empower you to recognize subtle shifts early.";
  }

  doc.fillColor(darkSlate).fontSize(11).font('Helvetica').text(summaryReflection, { lineGap: 3 });
  doc.moveDown(2);

  // --- Entries Listing Table ---
  doc.fontSize(16).font('Helvetica-Bold').text('Daily Breakdown');
  doc.moveDown(0.5);

  // Header Row
  const startY = doc.y;
  doc.fillColor(purpleAccent).font('Helvetica-Bold').fontSize(10);
  doc.text('Date', 50, startY);
  doc.text('Mood', 130, startY);
  doc.text('Journal Title', 220, startY);
  doc.text('Happiness', 490, startY, { align: 'right', width: 60 });
  
  doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
  doc.moveDown(0.8);

  // Entries
  doc.fillColor(darkSlate).font('Helvetica').fontSize(9);
  journals.slice(0, 20).forEach((j) => { // List up to 20 entries to prevent overflow on one page
    if (doc.y > 700) {
      doc.addPage();
      // Print header on new page
      doc.fillColor(purpleAccent).font('Helvetica-Bold').fontSize(10);
      doc.text('Date', 50, 40);
      doc.text('Mood', 130, 40);
      doc.text('Journal Title', 220, 40);
      doc.text('Happiness', 490, 40, { align: 'right', width: 60 });
      doc.strokeColor('#D1D5DB').lineWidth(1).moveTo(50, 55).lineTo(550, 55).stroke();
      doc.moveDown(1.2);
      doc.fillColor(darkSlate).font('Helvetica').fontSize(9);
    }
    
    const entryDate = new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const textY = doc.y;
    
    doc.text(entryDate, 50, textY);
    doc.text(j.mood, 130, textY);
    doc.text(j.title.substring(0, 45) + (j.title.length > 45 ? '...' : ''), 220, textY);
    doc.text(`${j.emotionScore || 50}%`, 490, textY, { align: 'right', width: 60 });
    
    doc.strokeColor('#F3F4F6').lineWidth(0.5).moveTo(50, textY + 12).lineTo(550, textY + 12).stroke();
    doc.moveDown(0.6);
  });

  if (journals.length > 20) {
    doc.moveDown(0.5);
    doc.fillColor('#6B7280').fontSize(8).text(`... and ${journals.length - 20} more entries logged in this billing period.`, { align: 'center' });
  }

  // Finalize PDF
  doc.end();
};

module.exports = {
  generateJournalPDF,
  generateMonthlyReportPDF
};
