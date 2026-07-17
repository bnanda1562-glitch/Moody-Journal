import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Camera, 
  Heart,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

const achievementsList = [
  { id: '7-day-streak', title: '7-Day Streak', desc: 'Maintained a 7-day journal logging streak', icon: '🔥' },
  { id: '30-day-streak', title: '30-Day Streak Master', desc: 'Maintained a 30-day journal logging streak', icon: '👑' },
  { id: '10-journals', title: 'Double Digits', desc: 'Logged 10 published entries into your digital diary', icon: '📚' },
  { id: '100-journals', title: '100 Reflections Centurion', desc: 'Logged 100 published entries into your digital diary', icon: '🌌' }
];

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile inputs
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [updating, setUpdating] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalCount: 0,
    longestStreak: 0,
    currentStreak: 0,
    favoriteMood: 'None'
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarPreview(user.avatar || '');
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const res = await axios.get('/api/analytics');
      if (res.data.success) {
        const statsData = res.data.stats;
        
        // Favorite mood detection
        const freq = res.data.moodFrequency || {};
        let fav = 'None';
        let maxCount = 0;
        Object.keys(freq).forEach(m => {
          if (freq[m] > maxCount) {
            maxCount = freq[m];
            fav = m;
          }
        });

        setStats({
          totalCount: statsData.totalJournals || 0,
          longestStreak: user?.longestStreak || 0,
          currentStreak: user?.streakCount || 0,
          favoriteMood: fav
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const formData = new FormData();
    formData.append('name', name);
    if (password) formData.append('password', password);
    if (avatarFile) formData.append('avatar', avatarFile);

    const result = await updateProfile(formData);
    setUpdating(false);

    if (result.success) {
      setPassword('');
      setAvatarFile(null);
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-6xl mx-auto w-full transition-all duration-300">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Your Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Info update Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <UserIcon size={16} className="text-brand-purple" />
                <span>Account Information</span>
              </h3>

              <form onSubmit={handleUpdate} className="space-y-5">
                {/* Avatar change block */}
                <div className="flex items-center gap-4 py-2">
                  <div className="relative w-20 h-20 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-extrabold text-3xl overflow-hidden border border-slate-200/20 shadow-inner">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name.charAt(0).toUpperCase()
                    )}
                    
                    <label className="absolute inset-0 bg-black/50 hover:bg-black/75 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition duration-200">
                      <Camera size={18} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Profile Image</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click circle to upload a custom JPG/PNG/WEBP avatar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 glass-input text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-100/30 dark:bg-slate-900/30 border border-slate-200/10 rounded-xl text-xs text-slate-400 w-full select-none">
                      <Mail size={14} />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/20 dark:border-slate-800/20 pt-5">
                  <h4 className="font-bold text-xs mb-3 flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                    <KeyRound size={14} className="text-slate-400" />
                    <span>Change Password</span>
                  </h4>
                  <div className="max-w-xs">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password (optional)"
                      className="w-full px-4 py-2.5 glass-input text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="glass-btn px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
                >
                  {updating ? 'Updating...' : 'Save Settings'}
                </button>
              </form>
            </div>

            {/* Achievements Card list */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <Trophy size={16} className="text-brand-purple" />
                <span>Achievements Unlocked ({user?.achievements?.length || 0})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievementsList.map((ach) => {
                  const isUnlocked = user?.achievements?.includes(ach.id);
                  return (
                    <div 
                      key={ach.id}
                      className={`p-4 rounded-xl border flex gap-3 transition-all ${
                        isUnlocked 
                          ? 'bg-gradient-to-tr from-brand-purple/5 to-brand-indigo/5 border-purple-500/20 shadow-sm' 
                          : 'bg-slate-100/10 dark:bg-slate-900/10 border-slate-200/10 opacity-40'
                      }`}
                    >
                      <div className="text-3xl flex items-center justify-center select-none">{ach.icon}</div>
                      <div>
                        <h4 className={`font-bold text-xs ${isUnlocked ? 'text-brand-purple dark:text-purple-300' : ''}`}>
                          {ach.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{ach.desc}</p>
                        <span className={`inline-block text-[8px] font-extrabold uppercase mt-2 px-1.5 py-0.5 rounded-full ${
                          isUnlocked 
                            ? 'bg-purple-500/10 text-brand-purple' 
                            : 'bg-slate-300 text-slate-500'
                        }`}>
                          {isUnlocked ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Quick statistics summary */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-purple" />
                <span>Wellness Statistics</span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/10">
                  <span className="text-xs text-slate-400 font-semibold">Total Journals</span>
                  <span className="text-sm font-bold">{stats.totalCount}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/10">
                  <span className="text-xs text-slate-400 font-semibold">Current Streak</span>
                  <span className="text-sm font-bold text-amber-500">{stats.currentStreak} days</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/10">
                  <span className="text-xs text-slate-400 font-semibold">Longest Streak</span>
                  <span className="text-sm font-bold">{stats.longestStreak} days</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/10">
                  <span className="text-xs text-slate-400 font-semibold">Favorite Mood</span>
                  <span className="text-sm font-bold flex items-center gap-1">
                    <span>{stats.favoriteMood}</span>
                    <span>{stats.favoriteMood !== 'None' ? '💖' : ''}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1"><Calendar size={13} /> Joined Date</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
