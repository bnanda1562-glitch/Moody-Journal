import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { ChartSkeleton, HeatmapSkeleton } from '../components/LoadingSkeleton';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
} from 'chart.js';
import { Download, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

const moodColorMap = {
  Happy: 'rgba(34, 197, 94, 0.6)',      // Green
  Excited: 'rgba(234, 179, 8, 0.6)',     // Yellow
  Neutral: 'rgba(148, 163, 184, 0.6)',   // Slate
  Tired: 'rgba(59, 130, 246, 0.6)',      // Blue
  Sad: 'rgba(99, 102, 241, 0.6)',        // Indigo
  Anxious: 'rgba(168, 85, 247, 0.6)',    // Purple
  Angry: 'rgba(239, 68, 68, 0.6)',       // Red
  Stressed: 'rgba(244, 63, 94, 0.6)'     // Rose
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/analytics');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // PDF Export Trigger
  const handleExportMonthly = async () => {
    setExporting(true);
    const loadToast = toast.loading(`Preparing PDF Report for ${selectedMonth}...`);
    try {
      const response = await axios.get(`/api/journals/export-monthly/${selectedMonth}`, {
        responseType: 'blob'
      });
      
      // Create PDF download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `monthly-report-${selectedMonth.replace(/\s+/g, '-')}.pdf`;
      link.click();
      
      toast.success('PDF report downloaded successfully!', { id: loadToast });
    } catch (error) {
      toast.error('Could not find any entries logged for this month.', { id: loadToast });
    } finally {
      setExporting(false);
    }
  };

  // 1. Daily Mood Line Chart Config
  const lineChartData = {
    labels: data?.dailyMoodLine.map(j => j.date) || [],
    datasets: [
      {
        label: 'Emotional Score',
        data: data?.dailyMoodLine.map(j => j.score) || [],
        fill: true,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        tension: 0.4,
        pointBackgroundColor: '#8B5CF6',
        pointHoverRadius: 8
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const entry = data?.dailyMoodLine[index];
            return entry ? `Mood: ${entry.mood}\nTitle: ${entry.title}` : '';
          }
        }
      }
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(148, 163, 184, 0.08)' } },
      x: { grid: { display: false } }
    }
  };

  // 2. Weekly Stress vs Happiness vs Positivity Bar Chart
  const barChartData = {
    labels: data?.weeklyTrends.map(t => t.day) || [],
    datasets: [
      {
        label: 'Happiness Index',
        data: data?.weeklyTrends.map(t => t.happiness) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.75)',
        borderRadius: 6
      },
      {
        label: 'Positivity Score',
        data: data?.weeklyTrends.map(t => t.positivity) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.75)',
        borderRadius: 6
      },
      {
        label: 'Stress Index',
        data: data?.weeklyTrends.map(t => t.stress) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.75)',
        borderRadius: 6
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20 } }
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(148, 163, 184, 0.08)' } },
      x: { grid: { display: false } }
    }
  };

  // 3. Monthly Mood Pie Chart
  const pieChartData = {
    labels: Object.keys(data?.moodFrequency || {}),
    datasets: [
      {
        data: Object.values(data?.moodFrequency || {}),
        backgroundColor: Object.keys(data?.moodFrequency || {}).map(m => moodColorMap[m] || 'rgba(0,0,0,0.1)'),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)'
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
    }
  };

  // 4. Heatmap calculations (past 180 days for optimal display width on dashboard)
  const renderHeatmap = () => {
    const cells = [];
    const today = new Date();
    
    // Create grid for 26 weeks (182 days)
    for (let dayOffset = 181; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Find entry on this date
      const matched = data?.heatmapData.find(h => h.date === dateStr);
      
      let color = 'bg-slate-100 dark:bg-slate-900/40 border border-slate-200/10';
      if (matched) {
        if (matched.score > 75) color = 'bg-green-500/80 shadow-sm shadow-green-500/10';
        else if (matched.score > 55) color = 'bg-blue-400/80 shadow-sm shadow-blue-500/10';
        else if (matched.score > 40) color = 'bg-purple-500/80 shadow-sm shadow-purple-500/10';
        else color = 'bg-red-500/80 shadow-sm shadow-red-500/10';
      }

      cells.push(
        <div
          key={dateStr}
          title={matched ? `${matched.mood} on ${dateStr} (Index: ${matched.score}%)` : `No log on ${dateStr}`}
          className={`w-3.5 h-3.5 rounded-sm heatmap-cell ${color}`}
        ></div>
      );
    }
    return cells;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-7xl mx-auto w-full transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Emotional Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualize emotional aggregates, stress waves, and tracker trends.</p>
          </div>
          
          {/* Monthly PDF Export control */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/20 dark:bg-black/20 text-xs font-bold focus:outline-none"
            >
              <option value="January 2026">January 2026</option>
              <option value="February 2026">February 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="October 2026">October 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="December 2026">December 2026</option>
            </select>
            <button
              onClick={handleExportMonthly}
              disabled={exporting}
              className="glass-btn px-4 py-2.5 text-xs flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>{exporting ? 'Exporting...' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <HeatmapSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Happiness</span>
                <span className="text-2xl font-extrabold text-green-500">{data?.stats.avgHappiness}%</span>
              </div>
              <div className="glass-card p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Average Stress</span>
                <span className="text-2xl font-extrabold text-red-500">{data?.stats.avgStress}%</span>
              </div>
              <div className="glass-card p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mean Sleep Duration</span>
                <span className="text-2xl font-extrabold text-brand-purple">{data?.stats.avgSleep || 0} hrs</span>
              </div>
              <div className="glass-card p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mean Water Intake</span>
                <span className="text-2xl font-extrabold text-brand-blue">{data?.stats.avgWater || 0} ml</span>
              </div>
            </div>

            {/* Line and Bar split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Line Chart */}
              <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-1.5"><Activity size={16} className="text-brand-purple" /> Daily Happiness Trend</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Last 15 logs</span>
                </div>
                <div className="h-64">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>

              {/* Monthly Pie Distribution */}
              <div className="glass-card p-6 flex flex-col justify-between">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><PieChart size={16} className="text-brand-purple" /> Mood Frequency</h3>
                <div className="h-64 flex items-center justify-center">
                  {Object.values(data?.moodFrequency || {}).reduce((a, b) => a + b, 0) === 0 ? (
                    <span className="text-xs text-slate-400">No logs in this billing cycle</span>
                  ) : (
                    <Pie data={pieChartData} options={pieChartOptions} />
                  )}
                </div>
              </div>
            </div>

            {/* Weekly trends bar */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><BarChart3 size={16} className="text-brand-purple" /> Weekly Emotional Fluctuations</h3>
              <div className="h-64">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* 365 days contribution heatmap */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-sm flex items-center gap-1.5"><Calendar size={16} className="text-brand-purple" /> 6-Month Mood Heatmap</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Hover over squares for details</span>
              </div>
              <div className="flex flex-wrap gap-1 items-center justify-center p-2.5 bg-slate-100/30 dark:bg-slate-900/30 rounded-xl border border-slate-200/10">
                {renderHeatmap()}
              </div>
              <div className="flex justify-center items-center gap-4 text-[9px] text-slate-400 mt-4">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800 border border-slate-300/10"></span> Empty</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/80"></span> Stress/Anger</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500/80"></span> Anxious</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400/80"></span> Sad/Tired</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/80"></span> Happy/Excited</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
