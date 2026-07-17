import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import WriteJournal from './pages/WriteJournal';
import Analytics from './pages/Analytics';
import AIInsights from './pages/AIInsights';
import Trackers from './pages/Trackers';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import SharedJournalView from './pages/SharedJournalView';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 404 Page
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 text-center">
    <div className="glass-card p-10 max-w-md w-full">
      <h1 className="text-6xl font-black text-brand-purple mb-4">404</h1>
      <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 mb-6">The page you are looking for might have been removed or is temporarily unavailable.</p>
      <Link to="/" className="glass-btn px-6 py-2.5 text-xs inline-block">Go to Home</Link>
    </div>
  </div>
);

// We need to import Link inside NotFound but since it's inside App.jsx, let's import it from react-router-dom
import { Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            {/* Global Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'glass-card border-white/10 dark:text-white',
                style: {
                  background: 'light-dark(rgba(255,255,255,0.7), rgba(15,15,25,0.7))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.1))',
                  color: 'light-dark(#0f172a, #f8fafc)',
                  fontSize: '13px',
                  fontWeight: '600'
                }
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/shared/:shareToken" element={<SharedJournalView />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/write" element={<ProtectedRoute><WriteJournal /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
              <Route path="/trackers" element={<ProtectedRoute><Trackers /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
