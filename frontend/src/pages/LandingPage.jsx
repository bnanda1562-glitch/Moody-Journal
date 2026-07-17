import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Mic, BarChart3, Shield, ArrowRight, Heart } from 'lucide-react';

const LandingPage = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-slate-950 text-white">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-glow"></div>

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
            M
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">Mood Journal AI</span>
        </div>
        <div className="flex items-center gap-4">
          {token ? (
            <Link to="/dashboard" className="glass-btn px-5 py-2 text-sm flex items-center gap-1.5">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition">
                Sign In
              </Link>
              <Link to="/signup" className="glass-btn px-5 py-2.5 text-sm flex items-center gap-1">
                <span>Start Free</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center z-10 py-16">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 mb-6 animate-bounce">
            <Heart size={12} className="fill-purple-300" />
            <span>Reflect deeper, live lighter</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Track Your Moods. <br />
            <span className="bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-blue bg-clip-text text-transparent">
              Empower Your Mind with AI.
            </span>
          </h2>

          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Mood Journal AI combines traditional diary writing, voice dictation, and advanced AI cognitive analytics to chart your emotional well-being, map stress patterns, and suggest healthy habits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            {token ? (
              <Link to="/dashboard" className="glass-btn px-8 py-3.5 text-base flex items-center gap-2">
                <span>Open Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="glass-btn px-8 py-3.5 text-base flex items-center gap-2 w-full sm:w-auto justify-center">
                  <span>Start Your Journaling Journey</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="px-8 py-3.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition w-full sm:w-auto">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left mt-8">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/30 transition duration-300">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                <Brain size={20} />
              </div>
              <h3 className="font-bold text-base mb-2">AI Mental Insights</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gemini automatically parses stress, anxiety, and positivity levels, providing comforting reflections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 transition duration-300">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Mic size={20} />
              </div>
              <h3 className="font-bold text-base mb-2">Voice Dictation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dictate journals using Web Speech recognition. Converts vocal patterns seamlessly to structured diaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/30 transition duration-300">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <BarChart3 size={20} />
              </div>
              <h3 className="font-bold text-base mb-2">Interactive Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualize emotional waves over weeks and months with lines, contribution grids, and pie breakdowns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/30 transition duration-300">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-base mb-2">Private Secure Shares</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Keep diaries locked or generate temporary, end-to-end encrypted sharing links for counselors.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-slate-500 text-xs z-10">
        <p>© 2026 Mood Journal AI. Designed as a premium self-care companion app.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
