import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Reset token is missing in URL');
    if (password.length < 6) return toast.error('Password must be at least 6 characters long');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setSubmitting(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        resetToken: token,
        password
      });

      if (res.data.success) {
        toast.success('Password reset completed successfully!');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[80px]"></div>

      <div className="glass-card max-w-md w-full p-8 z-10 border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Create New Password</h2>
          <p className="text-xs text-slate-400 mt-2">Enter your new secure login password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="Confirm password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 glass-btn text-sm mt-2 flex justify-center items-center font-bold"
          >
            {submitting ? 'Resetting...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
