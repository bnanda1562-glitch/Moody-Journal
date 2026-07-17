import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { 
  Droplet, 
  Moon, 
  Timer, 
  CheckSquare, 
  Target, 
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Trackers = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [tracker, setTracker] = useState({
    waterIntake: 0,
    sleepHours: 0,
    pomodoroSessions: 0,
    habits: [],
    goals: []
  });

  // Habit & Goal inputs
  const [newHabit, setNewHabit] = useState('');
  const [newGoal, setNewGoal] = useState('');

  // Pomodoro Timer state
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Fetch trackers when date changes
  useEffect(() => {
    const fetchTrackers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/trackers?date=${date}`);
        if (res.data.success) {
          setTracker(res.data.tracker);
        }
      } catch (error) {
        console.error('Failed to load tracker logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrackers();
  }, [date]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Water log
  const handleWater = async (amount) => {
    try {
      const res = await axios.post('/api/trackers/water', { date, amount });
      if (res.data.success) {
        setTracker(res.data.tracker);
        toast.success(amount > 0 ? `Logged +${amount}ml water!` : `Removed ${Math.abs(amount)}ml water`);
      }
    } catch (error) {
      toast.error('Failed to log water intake');
    }
  };

  // Sleep log
  const handleSleep = async (hours) => {
    try {
      const res = await axios.post('/api/trackers/sleep', { date, hours });
      if (res.data.success) {
        setTracker(res.data.tracker);
        toast.success(`Logged ${hours} hours of sleep`);
      }
    } catch (error) {
      toast.error('Failed to log sleep');
    }
  };

  // Habit management
  const handleHabit = async (action, habitName, completed) => {
    try {
      const res = await axios.post('/api/trackers/habit', {
        date,
        habitName,
        completed,
        action
      });
      if (res.data.success) {
        setTracker(res.data.tracker);
        if (action === 'add') {
          setNewHabit('');
          toast.success('Habit added successfully!');
        } else if (action === 'toggle') {
          toast.success(completed ? 'Habit completed!' : 'Habit unchecked');
        } else if (action === 'delete') {
          toast.success('Habit deleted');
        }
      }
    } catch (error) {
      toast.error('Failed to update habit');
    }
  };

  // Goal management
  const handleGoal = async (action, goalName, completed) => {
    try {
      const res = await axios.post('/api/trackers/goal', {
        date,
        goalName,
        completed,
        action
      });
      if (res.data.success) {
        setTracker(res.data.tracker);
        if (action === 'add') {
          setNewGoal('');
          toast.success('Goal added successfully!');
        } else if (action === 'toggle') {
          toast.success(completed ? 'Goal achieved!' : 'Goal unchecked');
        } else if (action === 'delete') {
          toast.success('Goal deleted');
        }
      }
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  // Pomodoro timer logic
  const startTimer = () => {
    if (timerIsRunning) return;
    setTimerIsRunning(true);
    
    timerIntervalRef.current = setInterval(() => {
      setPomodoroSeconds((prevSec) => {
        if (prevSec === 0) {
          setPomodoroMinutes((prevMin) => {
            if (prevMin === 0) {
              // Timer Finished
              handlePomodoroComplete();
              clearInterval(timerIntervalRef.current);
              setTimerIsRunning(false);
              return 25; // Reset to 25 mins
            }
            return prevMin - 1;
          });
          return 59;
        }
        return prevSec - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setTimerIsRunning(false);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  };

  const handlePomodoroComplete = async () => {
    toast.success('🍅 Focus session complete! Time for a short break.');
    
    // Trigger notification audio
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
      audio.play();
    } catch (e) {}

    // Log to DB
    try {
      const res = await axios.post('/api/trackers/pomodoro', { date });
      if (res.data.success) {
        setTracker(res.data.tracker);
      }
    } catch (error) {
      console.error('Failed to save Pomodoro count:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-7xl mx-auto w-full transition-all duration-300">
        {/* Header and Date selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Habit & Health Trackers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log water, calculate sleep, time tasks, and complete goals.</p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/20 dark:bg-black/20 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
            <CalendarIcon size={16} className="text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Water & Sleep & Pomodoro (takes 2 sections stacked) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Water & Sleep split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Water tracker */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm">Water Intake</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">Recommended: 2000 ml daily</p>
                    
                    <div className="text-center my-6">
                      <span className="text-3xl font-black text-brand-blue">{tracker.waterIntake}</span>
                      <span className="text-sm font-semibold text-slate-400"> / 2000 ml</span>
                      
                      {/* Fluid percentage fill container */}
                      <div className="w-full bg-slate-100 dark:bg-slate-900/60 h-2.5 rounded-full overflow-hidden mt-4">
                        <div 
                          className="bg-brand-blue h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (tracker.waterIntake / 2000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWater(-250)}
                      disabled={tracker.waterIntake <= 0}
                      className="flex-1 py-2.5 rounded-xl border border-red-500/10 hover:bg-red-500/5 text-red-500 text-xs font-bold disabled:opacity-30 transition"
                    >
                      -250 ml
                    </button>
                    <button
                      onClick={() => handleWater(250)}
                      className="flex-1 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-md shadow-blue-500/10 hover:bg-blue-600 transition"
                    >
                      +250 ml
                    </button>
                  </div>
                </div>

                {/* Sleep tracker */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Moon size={18} className="text-indigo-500" />
                      <h3 className="font-bold text-sm">Sleep Tracker</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">Recommended: 7-8 hours daily</p>
                    
                    <div className="text-center my-6">
                      <span className="text-3xl font-black text-indigo-500">{tracker.sleepHours}</span>
                      <span className="text-sm font-semibold text-slate-400"> hrs</span>
                      
                      <input
                        type="range"
                        min="0"
                        max="16"
                        step="0.5"
                        value={tracker.sleepHours}
                        onChange={(e) => handleSleep(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-full appearance-none cursor-pointer mt-6 accent-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic text-center">
                    Consistent sleep cycles stabilize daily emotional scores.
                  </p>
                </div>
              </div>

              {/* Pomodoro Focus timer */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Timer size={18} className="text-red-500" />
                    <h3 className="font-bold text-sm">Pomodoro Timer</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold">
                    Logged Today: {tracker.pomodoroSessions || 0}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-4">
                  <div className="text-center md:border-r border-slate-200/20 md:pr-6">
                    <div className="text-5xl font-black tracking-widest tabular-nums text-slate-800 dark:text-white mb-4">
                      {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      {timerIsRunning ? (
                        <button
                          onClick={pauseTimer}
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:bg-amber-600"
                        >
                          <Pause size={14} />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          onClick={startTimer}
                          className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:bg-red-600"
                        >
                          <Play size={14} />
                          <span>Start</span>
                        </button>
                      )}
                      
                      <button
                        onClick={resetTimer}
                        className="px-4 py-2 border border-slate-200/40 dark:border-slate-800/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-900"
                      >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-300">How to use Pomodoro Focus:</p>
                    <p>1. Dedicate 25 minutes to writing, drawing, or quiet reading.</p>
                    <p>2. Keep notifications silent and focus solely on the activity.</p>
                    <p>3. When the chime sounds, log a session and take a 5-minute breather.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Habits & Goals Checklist (takes 1 column space) */}
            <div className="space-y-6">
              
              {/* Daily Habits */}
              <div className="glass-card p-6 flex flex-col justify-between h-[360px]">
                <div className="min-h-0 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare size={18} className="text-brand-purple" />
                    <h3 className="font-bold text-sm">Habit Tracker</h3>
                  </div>

                  {/* Scrollable Habits List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {tracker.habits?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No habits added for today.</p>
                    ) : (
                      tracker.habits?.map((h) => (
                        <div key={h._id || h.habitName} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={h.completed}
                              onChange={(e) => handleHabit('toggle', h.habitName, e.target.checked)}
                              className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple cursor-pointer"
                            />
                            <span className={h.completed ? 'line-through text-slate-400' : 'font-semibold text-slate-700 dark:text-slate-200'}>
                              {h.habitName}
                            </span>
                          </label>
                          <button
                            onClick={() => handleHabit('delete', h.habitName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Habit input */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleHabit('add', newHabit); }}
                  className="flex items-center gap-2 pt-4 border-t border-slate-200/20 dark:border-slate-800/20 mt-4"
                >
                  <input
                    type="text"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    placeholder="Add new habit..."
                    className="flex-1 px-3 py-2 text-xs glass-input"
                    required
                  />
                  <button type="submit" className="p-2.5 rounded-xl bg-brand-purple text-white flex items-center justify-center hover:bg-indigo-600 transition shadow-sm">
                    <Plus size={14} />
                  </button>
                </form>
              </div>

              {/* Today's Goals */}
              <div className="glass-card p-6 flex flex-col justify-between h-[360px]">
                <div className="min-h-0 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={18} className="text-brand-purple" />
                    <h3 className="font-bold text-sm">Today's Focus Goals</h3>
                  </div>

                  {/* Scrollable Goals List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {tracker.goals?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No goals set for today.</p>
                    ) : (
                      tracker.goals?.map((g) => (
                        <div key={g._id || g.goalName} className="flex items-center justify-between p-2 rounded-lg bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={g.completed}
                              onChange={(e) => handleGoal('toggle', g.goalName, e.target.checked)}
                              className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple cursor-pointer"
                            />
                            <span className={g.completed ? 'line-through text-slate-400' : 'font-semibold text-slate-700 dark:text-slate-200'}>
                              {g.goalName}
                            </span>
                          </label>
                          <button
                            onClick={() => handleGoal('delete', g.goalName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Goal input */}
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleGoal('add', newGoal); }}
                  className="flex items-center gap-2 pt-4 border-t border-slate-200/20 dark:border-slate-800/20 mt-4"
                >
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Set priority goal..."
                    className="flex-1 px-3 py-2 text-xs glass-input"
                    required
                  />
                  <button type="submit" className="p-2.5 rounded-xl bg-brand-purple text-white flex items-center justify-center hover:bg-indigo-600 transition shadow-sm">
                    <Plus size={14} />
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default Trackers;
