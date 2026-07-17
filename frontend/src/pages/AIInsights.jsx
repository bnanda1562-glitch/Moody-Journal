import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { CardSkeleton } from '../components/LoadingSkeleton';
import axios from 'axios';
import { 
  Brain, 
  Sparkles, 
  ThumbsUp, 
  AlertTriangle, 
  Compass, 
  CheckCircle2, 
  HelpCircle,
  TrendingDown,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/insights');
        if (res.data.success) {
          setInsights(res.data.insights);
        }
      } catch (error) {
        console.error('Failed to load AI Insights:', error);
        toast.error('Failed to load AI Insights');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-6xl mx-auto w-full transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Insights & Guidance</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cognitive analysis of your journals powered by Google Gemini.</p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 flex items-center gap-1.5">
            <Brain size={14} />
            <span>AI Active</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : !insights ? (
          <div className="glass-card p-12 text-center text-slate-400 max-w-xl mx-auto mt-12">
            <Brain size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">No AI Insights Generated Yet</p>
            <p className="text-sm mt-2">Publish your first journal entry to receive cognitive wellness scores and personalized habits tracking.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Wellness Score Card */}
              <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4 w-full text-left">Mental Wellness Score</span>
                
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" strokeWidth="8" stroke="rgba(139, 92, 246, 0.08)" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      strokeWidth="8" 
                      stroke="url(#gradientScore)" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={2 * Math.PI * 60 * (1 - (insights.wellnessScore || 50) / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-extrabold text-brand-purple">{insights.wellnessScore}%</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Wellness Index</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                  Calculated based on positivity, low stress, and consistent journaling frequency.
                </p>
              </div>

              {/* Core Emotion Card */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Dominant Emotion</span>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{insights.mostCommonEmotion}</p>
                  <span className="text-xs text-slate-400 mt-2 block">Most frequent mood recorded this month.</span>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">Most Active:</span>
                    <span className="font-semibold text-brand-purple">{insights.mostActiveDay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Most Stressful:</span>
                    <span className="font-semibold text-red-500">{insights.mostStressfulDay}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Reflection Summary */}
              <div className="glass-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-purple-500/10">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Weekly Summary Reflection</span>
                  <div className="flex items-start gap-2.5 mt-2">
                    <Sparkles size={18} className="text-brand-purple flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{insights.weeklySummary}"
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 block mt-4 border-t border-slate-200/20 dark:border-slate-800/20 pt-3">
                  This summary aggregates and extracts sentiments from the past 7 days of diaries.
                </p>
              </div>
            </div>

            {/* Monthly Reflection Section */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-brand-purple" />
                <h3 className="font-bold text-base">30-Day Monthly Review</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {insights.monthlySummary}
              </p>
            </div>

            {/* AI Advice list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Positive/Negative Habits */}
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-green-500">
                    <ThumbsUp size={16} />
                    <span>Positive Habits Detected</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {insights.positiveHabits?.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-200/20 dark:border-slate-800/20 pt-6">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-amber-500">
                    <AlertTriangle size={16} />
                    <span>Trigger Alerts / Patterns</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {insights.negativeHabits?.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Advice and Action Pointers */}
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-brand-purple">
                    <Compass size={16} />
                    <span>Personalized Coping Advice</span>
                  </h3>
                  <ul className="space-y-3">
                    {insights.advice?.map((adv, i) => (
                      <li key={i} className="p-3 bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl text-xs leading-relaxed">
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500" />
                    <span>Wellness Recommendations</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.recommendations?.map((rec, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-brand-purple">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIInsights;
