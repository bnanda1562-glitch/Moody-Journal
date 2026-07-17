import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { 
  LayoutDashboard, 
  PenTool, 
  BarChart3, 
  Brain, 
  Activity, 
  User as UserIcon, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Bell 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, notifications, markAllAsRead } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Write Journal', path: '/write', icon: PenTool },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Insights', path: '/insights', icon: Brain },
    { name: 'Trackers', path: '/trackers', icon: Activity },
    { name: 'Profile', path: '/profile', icon: UserIcon }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-panel sticky top-0 z-40 w-full text-slate-800 dark:text-slate-100 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">Mood Journal AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) markAllAsRead();
            }}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button onClick={toggleMobileMenu} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Sidebar Desktop Container */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-200/40 dark:border-slate-800/40 p-6 flex flex-col justify-between transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">Mood Journal AI</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Premium Edition</span>
            </div>
          </div>

          {/* User profile capsule */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/20 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden shadow-inner">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-purple to-brand-indigo text-white shadow-md shadow-purple-500/10' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Admin link */}
            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                    : 'text-red-400 hover:bg-red-500/5 hover:text-red-500'
                }`}
              >
                <ShieldAlert size={18} />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Footer controls & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-200/20 dark:border-slate-800/20">
          {/* Theme & Notifications */}
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (unreadCount > 0) markAllAsRead();
              }}
              className="relative p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Notifications Drawer overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifications(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-sm w-full glass-panel border-l border-slate-200/20 dark:border-slate-800/20 shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="font-bold text-lg">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">All caught up!</p>
                  <p className="text-xs mt-1">No notifications to show.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className={`p-3.5 rounded-xl border transition-all ${
                    n.read 
                      ? 'bg-slate-100/30 dark:bg-slate-900/30 border-slate-200/20 dark:border-slate-800/20 text-slate-500 dark:text-slate-400' 
                      : 'bg-indigo-500/5 border-indigo-500/20 text-slate-800 dark:text-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        n.type === 'achievement' ? 'text-amber-500' : 'text-purple-500'
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs mt-1">{n.title}</h4>
                    <p className="text-[11px] mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
