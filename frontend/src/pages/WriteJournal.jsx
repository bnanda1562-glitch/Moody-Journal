import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  Trash2, 
  Image as ImageIcon, 
  Tag, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  Save, 
  FileText 
} from 'lucide-react';
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

const WriteJournal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const journalId = searchParams.get('id');
  const initialMood = searchParams.get('mood') || 'Neutral';

  const { user } = useAuth();
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(initialMood);
  const [tags, setTags] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Loading & Mode states
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);

  // Web Speech API / Audio Recording states
  const [isDictating, setIsDictating] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch journal details if editing
  useEffect(() => {
    if (journalId) {
      setIsEditMode(true);
      const fetchJournal = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/api/journals/${journalId}`);
          if (res.data.success) {
            const j = res.data.journal;
            setTitle(j.title);
            setContent(j.content);
            setMood(j.mood);
            setTags(j.tags ? j.tags.join(', ') : '');
            if (j.createdAt) {
              setDate(j.createdAt.split('T')[0]);
            }
            if (j.image) {
              setImagePreview(j.image);
            }
          }
        } catch (error) {
          toast.error('Failed to load journal entry');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchJournal();
    }
  }, [journalId]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Web Speech Recognition Handler
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error('Web Speech API is not supported in this browser. Please use Chrome/Safari.');
    }

    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsDictating(true);
        setDictationText('');
        toast.success('Microphone listening...');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Speech Recognition error: ${event.error}`);
        stopDictation();
      };

      recognitionRef.current.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setDictationText(prev => prev + finalTranscript);
      };

      recognitionRef.current.start();
      
      // Concurrently start raw audio recording for playback
      startAudioRecording();

    } catch (e) {
      console.error(e);
      toast.error('Could not initialize microphone access');
    }
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsDictating(false);
    
    // Stop raw audio recording
    stopAudioRecording();
  };

  // Audio Recording helpers (MediaRecorder)
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        
        // Stop all track streams to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error('Failed to record audio:', err);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const appendDictationToJournal = () => {
    if (!dictationText.trim()) return toast.error('No dictation transcript found');
    setContent(prev => (prev ? prev + '\n' + dictationText : dictationText));
    setDictationText('');
    toast.success('Appended transcript to journal text editor!');
  };

  const deleteRecording = () => {
    setAudioUrl('');
    setAudioBlob(null);
    setDictationText('');
    toast.success('Recording deleted');
  };

  // Save raw voice recording to db
  const saveAsVoiceJournalOnly = async () => {
    if (!dictationText && !content) return toast.error('Please dictate or write something first');
    
    const loadingToast = toast.loading('Uploading voice logs...');
    try {
      const formData = new FormData();
      formData.append('transcript', dictationText || content);
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      const res = await axios.post('/api/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Voice journal archived successfully!', { id: loadingToast });
        deleteRecording();
      }
    } catch (error) {
      toast.error('Voice archive upload failed', { id: loadingToast });
      console.error(error);
    }
  };

  // Generate Title via Gemini Helper
  const handleGenerateTitle = async () => {
    if (!content.trim()) return toast.error('Write journal content first so AI can suggest a title.');
    
    setGeneratingTitle(true);
    try {
      const res = await axios.post('/api/journals/generate-title', { content });
      if (res.data.success) {
        setTitle(res.data.title);
        toast.success('AI Suggested Title applied!');
      }
    } catch (error) {
      toast.error('AI Title generation failed. Using default.');
    } finally {
      setGeneratingTitle(false);
    }
  };

  // Handle image uploader previews
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save / Publish Journal
  const handleSave = async (isDraftStatus) => {
    if (!content.trim()) return toast.error('Journal content cannot be empty');

    const loadingToast = toast.loading(isEditMode ? 'Updating entry...' : 'Saving entry...');
    
    try {
      const formData = new FormData();
      formData.append('title', title || 'Untitled Reflection');
      formData.append('content', content);
      formData.append('mood', mood);
      formData.append('tags', tags);
      formData.append('isDraft', isDraftStatus ? 'true' : 'false');
      formData.append('createdAt', new Date(date).toISOString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (isEditMode) {
        res = await axios.put(`/api/journals/${journalId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/api/journals', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(
          isDraftStatus 
            ? 'Draft saved successfully!' 
            : 'Journal entry published and AI analyzed!',
          { id: loadingToast }
        );
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save journal', { id: loadingToast });
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-6 lg:p-10 max-w-6xl mx-auto w-full transition-all duration-300">
        {/* Back and Page Actions */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-xs font-bold border border-slate-200/40 dark:border-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSave(false)}
              className="glass-btn px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <FileText size={14} />
              <span>Publish Entry</span>
            </button>
          </div>
        </div>

        {/* Editor Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Editor (takes 2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 space-y-5">
              {/* Title Section */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title your reflection..."
                  className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-brand-purple focus:outline-none pb-2 text-slate-900 dark:text-white transition"
                />
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  disabled={generatingTitle}
                  title="Generate AI Title"
                  className="p-2.5 rounded-xl bg-purple-500/10 text-brand-purple hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center transition"
                >
                  <Sparkles size={18} className={generatingTitle ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Date and Tags row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/20">
                  <CalendarIcon size={16} className="text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-xs w-full focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/20">
                  <Tag size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Tags (comma-separated: happy, work)"
                    className="bg-transparent text-xs w-full focus:outline-none"
                  />
                </div>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How was your day? Pour out your thoughts here..."
                  className="w-full h-80 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed text-slate-800 dark:text-slate-200"
                ></textarea>
              </div>

              {/* Image upload selector block */}
              <div className="pt-4 border-t border-slate-200/20 dark:border-slate-800/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="p-2.5 rounded-xl border border-slate-200/20 bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition text-xs font-semibold">
                    <ImageIcon size={16} className="text-slate-400" />
                    <span>Attach Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="p-2.5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center justify-center transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {imagePreview && (
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200/20 shadow-inner">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Voice Dictation & Mood Selector Panel */}
          <div className="space-y-6">
            {/* Mood selector */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-4">Choose Today's Mood</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(moodEmojiMap).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                      mood === m 
                        ? 'bg-brand-purple/20 border-brand-purple scale-105 shadow-sm text-brand-purple dark:text-purple-300 font-bold' 
                        : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/20 dark:border-slate-800/20 text-slate-500 hover:border-slate-300 hover:scale-102'
                    }`}
                  >
                    <span className="text-2xl mb-1">{moodEmojiMap[m]}</span>
                    <span className="text-[10px]">{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Journal Panel */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Mic size={18} className="text-brand-purple" />
                <h3 className="font-bold text-sm">Voice Dictation</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Click the mic below to dictate your thoughts. Speak clearly, and we'll translate it to text.
              </p>

              {/* Dictation Status */}
              {isDictating && (
                <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span>Recording Voice and Dictating...</span>
                </div>
              )}

              {/* Dictation Text Display box */}
              {dictationText && (
                <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 dark:border-slate-800/20 max-h-40 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Transcript Preview</span>
                  {dictationText}
                </div>
              )}

              {/* Audio playback component */}
              {audioUrl && (
                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-brand-indigo" />
                    <span className="text-[10px] font-bold text-slate-500">Play Recording</span>
                  </div>
                  <audio src={audioUrl} controls className="w-48 h-8 scale-90" />
                </div>
              )}

              {/* Mic Toggles & Action Triggers */}
              <div className="flex flex-wrap gap-2 pt-2">
                {isDictating ? (
                  <button
                    type="button"
                    onClick={stopDictation}
                    className="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <MicOff size={14} />
                    <span>Stop Mic</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startDictation}
                    className="flex-1 py-2.5 rounded-xl border border-brand-purple/20 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Mic size={14} />
                    <span>Start Mic</span>
                  </button>
                )}

                {dictationText && (
                  <>
                    <button
                      type="button"
                      onClick={appendDictationToJournal}
                      className="w-full py-2.5 rounded-xl bg-brand-purple text-white text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-indigo-600 shadow-md shadow-purple-500/10"
                    >
                      <span>Append to Editor</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={saveAsVoiceJournalOnly}
                      className="flex-1 py-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-brand-indigo text-xs font-bold flex items-center justify-center transition"
                    >
                      <span>Archive Audio Only</span>
                    </button>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="px-3 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center justify-center transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WriteJournal;
