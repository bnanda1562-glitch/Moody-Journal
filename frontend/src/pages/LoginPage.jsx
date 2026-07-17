import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[80px]"></div>

      <div className="glass-card max-w-md w-full p-8 z-10 border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center font-bold text-xl text-white mx-auto mb-3 shadow-lg shadow-purple-500/20">
            M
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Reflect on your day, track your emotions</p>
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

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-brand-purple hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 glass-btn text-sm mt-2 flex justify-center items-center font-bold"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-purple font-bold hover:underline">
            Register Free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
