import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    setSubmitting(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success('Simulation: Reset Token generated!');
        // Redirect directly to reset password with simulated token for testing convenience
        navigate(`/reset-password?token=${res.data.resetToken}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email lookup failed');
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
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-2">Enter your email and we'll simulate generating a reset code link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="name@domain.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 glass-btn text-sm mt-2 flex justify-center items-center font-bold"
          >
            {submitting ? 'Generating link...' : 'Generate Reset Link'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Back to{' '}
          <Link to="/login" className="text-brand-purple font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
