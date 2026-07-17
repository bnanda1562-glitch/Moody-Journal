import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton, JournalItemSkeleton } from '../components/LoadingSkeleton';
import axios from 'axios';
import { 
  Flame, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Plus, 
  TrendingUp, 
  Search, 
  ChevronRight, 
  BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';

const moodEmojiMap = {
  Happy: '😊',
  Neutral: '😐',
  Sad: '😢',
  Angry: '😡',
  Anxious: '😰',
  Excited: '😍',
  Tired: '😴',
  Stressed: '😭'
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streakCount: 0,
    longestStreak: 0,
    todayMoodLogged: false,
    todayMood: '',
    totalJournals: 0
  });
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch journals
        const journalsRes = await axios.get('/api/journals');
        // Fetch analytics summary
        const analyticsRes = await axios.get('/api/analytics');

        if (journalsRes.data.success && analyticsRes.data.success) {
          const list = journalsRes.data.journals || [];
          setJournals(list);
          setAnalytics(analyticsRes.data);

          // Calculate today mood logged status
          const todayStr = new Date().toISOString().split('T')[0];
          const todayEntry = list.find(j => j.createdAt.split('T')[0] === todayStr && !j.isDraft);
          
          setStats({
            streakCount: user?.streakCount || 0,
            longestStreak: user?.longestStreak || 0,
            todayMoodLogged: !!todayEntry,
            todayMood: todayEntry ? todayEntry.mood : '',
            totalJournals: list.filter(j => !j.isDraft).length
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle reporting mood from quick dashboard buttons
  const handleQuickMood = (selectedMood) => {
    navigate(`/write?mood=${selectedMood}`);
  };

  const getCalendarDays = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    
    const days = [];
    // Pad empty spaces for calendar alignment
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true });
    }

    const todayStr = today.toISOString().split('T')[0].substring(0, 8); // YYYY-MM-

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = todayStr + String(i).padStart(2, '0');
      const entry = journals.find(j => j.createdAt.split('T')[0] === dayStr && !j.isDraft);
      
      days.push({
        dayNum: i,
        logged: !!entry,
        mood: entry ? entry.mood : '',
        id: entry ? entry._id : null
      });
    }

    return days;
  };

  const calendarDays = getCalendarDays();
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // AI suggestions fallback card content
  const randomAIAdvice = analytics?.stats?.avgStress > 60 
    ? {
        feedback: "Your stress index is elevated today. Take 5 minutes to unplug and breathe.",
        quote: "Feelings are just visitor, let them come and go. - Mooji",
        activity: "Box breathing (4s inhale, 4s hold, 4s exhale, 4s hold)"
      }
    : {
        feedback: "Your emotional baseline is stable and positive. Good job maintaining a journaling habit!",
        quote: "Write it on your heart that every day is the best day in the year. - Ralph Waldo Emerson",
        activity: "Practice gratitude: write down 3 things you are thankful for"
      };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-7xl mx-auto w-full transition-all duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hello, <span className="text-brand-purple">{user?.name}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here is a summary of your emotional landscape today.</p>
          </div>
          <Link to="/write" className="glass-btn px-5 py-3 text-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Write New Journal</span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Streak Card */}
              <div className="glass-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Journal Streak</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-amber-500">{stats.streakCount}</span>
                    <span className="text-sm font-semibold text-slate-400">days</span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-2">Longest streak: {stats.longestStreak} days</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500 animate-pulse">
                  <Flame size={24} className="fill-amber-500/20" />
                </div>
              </div>

              {/* Today Mood Card */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Today's Mood</span>
                  {stats.todayMoodLogged ? (
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{moodEmojiMap[stats.todayMood]}</span>
                      <div>
                        <span className="font-bold text-lg">{stats.todayMood}</span>
                        <span className="text-xs text-green-500 block">Mood logged successfully</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.keys(moodEmojiMap).map((m) => (
                        <button
                          key={m}
                          onClick={() => handleQuickMood(m)}
                          title={m}
                          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/50 hover:bg-brand-purple/20 border border-slate-200/20 dark:border-slate-800/20 flex items-center justify-center text-xl transition-all hover:scale-110"
                        >
                          {moodEmojiMap[m]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Journals Card */}
              <div className="glass-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Reflections</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-brand-purple">{stats.totalJournals}</span>
                    <span className="text-sm font-semibold text-slate-400">entries</span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-2">Published to cloud database</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center text-brand-purple">
                  <BookOpen size={24} />
                </div>
              </div>
            </div>

            {/* Dashboard Main Grid Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Entries & AI suggestion */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Journals */}
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Recent Journals</h3>
                    <Link to="/analytics" className="text-xs font-bold text-brand-purple hover:underline flex items-center gap-0.5">
                      <span>View History</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {journals.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 bg-slate-100/10 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200/20 dark:border-slate-800/20">
                        <Plus size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-semibold">Your journal is empty.</p>
                        <p className="text-xs mt-1 mb-4">Start recording your thoughts and feelings today.</p>
                        <Link to="/write" className="glass-btn px-4 py-2 text-xs inline-flex items-center gap-1.5">
                          <Plus size={14} />
                          <span>Write First Entry</span>
                        </Link>
                      </div>
                    ) : (
                      journals.slice(0, 3).map((j) => (
                        <div 
                          key={j._id}
                          onClick={() => navigate(`/write?id=${j._id}`)}
                          className="p-4 rounded-xl border border-slate-200/20 dark:border-slate-800/20 bg-slate-100/10 dark:bg-slate-900/10 hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition cursor-pointer flex justify-between items-start gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-lg">{moodEmojiMap[j.mood]}</span>
                              <h4 className="font-bold text-sm truncate">{j.title}</h4>
                              {j.isDraft && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold">Draft</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{j.content}</p>
                            <span className="text-[10px] text-slate-500 block mt-2">
                              {new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          
                          {/* Image preview */}
                          {j.image && (
                            <img src={j.image} alt="Upload" className="w-12 h-12 rounded-lg object-cover border border-slate-200/10" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* AI Suggestion Box */}
                <div className="glass-card p-6 bg-gradient-to-br from-brand-purple/10 to-brand-indigo/10 border-brand-purple/20 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] rounded-full bg-purple-500/10 blur-[30px]"></div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-brand-purple animate-pulse" />
                    <h3 className="font-bold text-base text-brand-purple dark:text-purple-300">AI Wellness Insight</h3>
                  </div>

                  <p className="text-sm font-semibold italic text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {randomAIAdvice.feedback}
                  </p>

                  <div className="p-3.5 rounded-xl bg-white/40 dark:bg-black/40 border border-slate-200/20 dark:border-slate-800/20 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Activity</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{randomAIAdvice.activity}</p>
                  </div>

                  <p className="text-xs text-slate-400 italic text-center">
                    "{randomAIAdvice.quote}"
                  </p>
                </div>
              </div>

              {/* Right Column: Calendar Grid & Mood Index */}
              <div className="space-y-6">
                {/* Calendar Card */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={18} className="text-brand-purple" />
                      <h3 className="font-bold text-sm">Emotion Calendar</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Weekday headers */}
                    {weekdayNames.map((w) => (
                      <span key={w} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                        {w}
                      </span>
                    ))}

                    {/* Days */}
                    {calendarDays.map((day, idx) => {
                      if (day.empty) {
                        return <div key={`empty-${idx}`} className="aspect-square"></div>;
                      }

                      // Color mapping depending on mood
                      let bgClass = 'bg-slate-100/40 dark:bg-slate-900/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60';
                      if (day.logged) {
                        if (day.mood === 'Happy' || day.mood === 'Excited') bgClass = 'bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400';
                        else if (day.mood === 'Sad' || day.mood === 'Tired') bgClass = 'bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400';
                        else if (day.mood === 'Angry' || day.mood === 'Stressed') bgClass = 'bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400';
                        else if (day.mood === 'Anxious') bgClass = 'bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400';
                        else bgClass = 'bg-slate-400/20 border border-slate-400/30 text-slate-700 dark:text-slate-300';
                      }

                      return (
                        <button
                          key={`day-${day.dayNum}`}
                          disabled={!day.logged}
                          onClick={() => day.id && navigate(`/write?id=${day.id}`)}
                          title={day.logged ? `${day.mood} on Day ${day.dayNum}` : `No entry for Day ${day.dayNum}`}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${bgClass} ${day.logged ? 'hover:scale-110 cursor-pointer shadow-sm' : 'cursor-default'}`}
                        >
                          {day.dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200/20 dark:border-slate-800/20 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500/20 border border-green-500/30 rounded-sm"></span> Happy/Excited</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/30 rounded-sm"></span> Stress/Anger</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500/30 rounded-sm"></span> Sad/Tired</span>
                  </div>
                </div>

                {/* Wellbeing score index dial */}
                <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4 w-full text-left">Wellness Index</span>
                  
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Ring background */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="rgba(139, 92, 246, 0.08)" fill="transparent" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="54" 
                        strokeWidth="8" 
                        stroke="url(#purpleGradient)" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - (analytics?.stats?.avgHappiness || 50) / 100)}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-indigo-600 dark:text-purple-300">
                        {analytics?.stats?.avgHappiness || 50}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Average</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    Based on your positivity scores over the last 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
