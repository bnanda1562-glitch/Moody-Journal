import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Users as UsersIcon, 
  BookOpen, 
  Activity, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access Denied: Admin role required');
      navigate('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const usersRes = await axios.get('/api/admin/users');
        const statsRes = await axios.get('/api/admin/stats');

        if (usersRes.data.success && statsRes.data.success) {
          setUsersList(usersRes.data.users);
          setPlatformStats(statsRes.data.stats);
        }
      } catch (error) {
        console.error('Failed to load admin controls:', error);
        toast.error('Failed to load administrative panels');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const handleDeleteUser = async (id, name) => {
    const confirm = window.confirm(`Are you absolutely sure you want to delete the user "${name}" and ALL of their journal entries? This action is permanent.`);
    if (!confirm) return;

    try {
      const res = await axios.delete(`/api/admin/users/${id}`);
      if (res.data.success) {
        toast.success(`User ${name} deleted successfully`);
        // Filter user out of list
        setUsersList(prev => prev.filter(u => u._id !== id));
        // Re-fetch stats
        const statsRes = await axios.get('/api/admin/stats');
        if (statsRes.data.success) {
          setPlatformStats(statsRes.data.stats);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-7xl mx-auto w-full transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform management, metrics auditing, and user moderation panels.</p>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>Root Admin Mode</span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="glass-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Active Accounts</span>
                  <span className="text-4xl font-extrabold text-brand-purple">{platformStats?.totalUsers}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center text-brand-purple">
                  <UsersIcon size={24} />
                </div>
              </div>

              {/* Total Journals */}
              <div className="glass-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Journal Entries</span>
                  <span className="text-4xl font-extrabold text-brand-indigo">{platformStats?.totalJournals}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-brand-indigo">
                  <BookOpen size={24} />
                </div>
              </div>

              {/* Average happiness Index */}
              <div className="glass-card p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Platform Wellbeing Index</span>
                  <span className="text-4xl font-extrabold text-green-500">{platformStats?.averageMood}%</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center text-green-500">
                  <Activity size={24} />
                </div>
              </div>
            </div>

            {/* Split grid for User Table and active users list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Users Table */}
              <div className="glass-card p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base mb-4">User Accounts Registry</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/20 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-1">Name</th>
                          <th className="py-3 px-1">Email</th>
                          <th className="py-3 px-1">Joined Date</th>
                          <th className="py-3 px-1 text-center">Streak</th>
                          <th className="py-3 px-1 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u) => (
                          <tr key={u._id} className="border-b border-slate-200/10 hover:bg-slate-100/10 dark:hover:bg-slate-900/10 transition">
                            <td className="py-3.5 px-1 font-bold">{u.name} {u.role === 'admin' && '👑'}</td>
                            <td className="py-3.5 px-1 text-slate-400">{u.email}</td>
                            <td className="py-3.5 px-1">{new Date(u.joinedAt).toLocaleDateString()}</td>
                            <td className="py-3.5 px-1 text-center font-bold text-amber-500">{u.streakCount || 0}d</td>
                            <td className="py-3.5 px-1 text-right">
                              {u.role !== 'admin' ? (
                                <button
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 text-red-500 transition"
                                  title="Delete User account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">Admin</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Most Active Users */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-brand-purple" />
                  <span>Most Active Authors</span>
                </h3>
                <div className="space-y-4">
                  {platformStats?.mostActiveUsers.map((item, idx) => (
                    <div key={item.user._id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 text-xs">
                      <div>
                        <h4 className="font-bold">{item.user.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.user.email}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-brand-purple">{item.journalCount}</span>
                        <span className="text-[10px] text-slate-400 block">entries</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
