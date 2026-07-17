import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error('Please fill in all fields');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    setSubmitting(true);
    const result = await signup(name, email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
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
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Start tracking your daily mindfulness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="Alex Johnson"
              required
            />
          </div>

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
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 glass-input text-sm text-white"
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 glass-btn text-sm mt-2 flex justify-center items-center font-bold"
          >
            {submitting ? 'Creating Account...' : 'Get Started Free'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-purple font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
