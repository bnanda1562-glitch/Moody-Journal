import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Heart, ThumbsUp, Laugh, Angry, Frown, Sparkles, Download, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

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

const emojiOptions = ['❤️', '👍', '😮', '😂', '😢', '🙏'];

const SharedJournalView = () => {
  const { shareToken } = useParams();
  const { user } = useAuth();
  
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const fetchSharedJournal = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/journals/shared/${shareToken}`);
        if (res.data.success) {
          setJournal(res.data.journal);
          setReactions(res.data.journal.emojiReactions || []);
        }
      } catch (error) {
        console.error('Failed to load shared journal:', error);
      } finally {
        setLoading(false);
      }
    };
    if (shareToken) {
      fetchSharedJournal();
    }
  }, [shareToken]);

  // Handle reactions
  const handleReact = async (emoji) => {
    if (!user) {
      return toast.error('You must log in to react to this journal entry!');
    }

    try {
      const res = await axios.post(`/api/journals/${journal._id}/react`, { emoji });
      if (res.data.success) {
        setReactions(res.data.emojiReactions);
        toast.success(`Reaction updated!`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to register reaction');
    }
  };

  const handleExportPDF = async () => {
    toast.success('Starting PDF download...');
    try {
      const response = await axios.get(`/api/journals/export/${journal._id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `shared-journal-${journal._id}.pdf`;
      link.click();
    } catch (e) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 text-center">
        <div className="glass-card p-10 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-500 mb-2">Link Expired or Invalid</h2>
          <p className="text-xs text-slate-400 mb-6">This private shared journal link could not be loaded. It may have been disabled by the author.</p>
          <Link to="/" className="glass-btn px-6 py-2.5 text-xs inline-block">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"></div>

      <div className="max-w-2xl w-full space-y-6 z-10">
        {/* Top Branding Banner */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center font-bold text-sm">
              M
            </div>
            <span className="font-extrabold text-sm tracking-wider text-slate-300">Mood Journal AI</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Download size={12} />
              <span>Save PDF</span>
            </button>
            
            {!user && (
              <Link to="/login" className="glass-btn px-3.5 py-1.5 text-xs">
                Login / Register
              </Link>
            )}
          </div>
        </div>

        {/* Journal Glass Box */}
        <div className="glass-card p-8 space-y-6 border-white/5 shadow-2xl">
          {/* Author info */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/10">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white overflow-hidden shadow-inner">
              {journal.userId?.avatar ? (
                <img src={journal.userId.avatar} alt="Author" className="w-full h-full object-cover" />
              ) : (
                journal.userId?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Shared Reflection by</span>
              <h4 className="font-bold text-sm">{journal.userId?.name || 'Anonymous User'}</h4>
            </div>
          </div>

          {/* Title & Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{moodEmojiMap[journal.mood]}</span>
              <h1 className="text-2xl font-black">{journal.title}</h1>
            </div>
            <span className="text-[10px] text-slate-500">
              Recorded on {new Date(journal.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Image */}
          {journal.image && (
            <div className="rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <img src={journal.image} alt="Journal Attachment" className="w-full max-h-72 object-cover" />
            </div>
          )}

          {/* Content */}
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{journal.content}</p>

          {/* Tags */}
          {journal.tags && journal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {journal.tags.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-semibold">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* AI analysis Box (only if requested by author or available) */}
          {journal.AIAnalysis && journal.AIAnalysis.feedback && (
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-brand-purple/5 to-brand-indigo/5 border border-purple-500/10 space-y-4">
              <div className="flex items-center gap-1.5 text-brand-purple dark:text-purple-300">
                <Sparkles size={16} className="animate-pulse" />
                <h4 className="font-bold text-xs">AI Emotional Reflections</h4>
              </div>
              <p className="text-xs italic text-slate-400 leading-relaxed">
                "{journal.AIAnalysis.feedback}"
              </p>
              
              <div className="flex gap-4 pt-2 border-t border-slate-200/5 text-[10px] text-slate-500">
                <span>Positivity Index: {journal.AIAnalysis.positivityScore || 50}%</span>
                <span>Stress Level: {journal.AIAnalysis.stressLevel || 20}%</span>
              </div>
            </div>
          )}

          {/* Reactions bar */}
          <div className="pt-6 border-t border-slate-200/10 space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare size={12} />
              <span>Leave a Reaction</span>
            </h5>
            
            <div className="flex flex-wrap gap-2 items-center">
              {/* React buttons */}
              {emojiOptions.map((emoji) => {
                const group = reactions.find(r => r.emoji === emoji);
                const hasReacted = group?.users.includes(user?.id);
                
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                      hasReacted 
                        ? 'bg-brand-purple/10 border-brand-purple text-brand-purple' 
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{emoji}</span>
                    {group && <span className="font-bold text-[10px]">{group.users.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedJournalView;
