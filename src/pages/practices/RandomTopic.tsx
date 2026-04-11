import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Mic, Square, Loader2, AlertCircle, RefreshCw, Play, Sparkles, Shuffle } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { analyzeSpeech } from '../../services/gemini';
import { randomTopics } from '../../data/topics';

type Step = 'config' | 'prep' | 'speaking' | 'analyzing';

export default function RandomTopic() {
  const navigate = useNavigate();
  const { addSession, user } = useUser();
  
  const [step, setStep] = useState<Step>('config');
  const [prepTime, setPrepTime] = useState(30);
  const [speakTime, setSpeakTime] = useState(60);
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (step === 'prep' || step === 'speaking') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (step === 'prep') {
        startSpeaking();
      } else if (step === 'speaking') {
        stopRecording();
      }
    }
  }, [timeLeft, step]);

  const generateTopic = () => {
    const randomIndex = Math.floor(Math.random() * randomTopics.length);
    setTopic(randomTopics[randomIndex]);
  };

  const startPrep = async () => {
    setError(null);
    try {
      // Request mic permission early to avoid delay between prep and speak
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      generateTopic();
      setTimeLeft(prepTime);
      setStep('prep');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const startSpeaking = () => {
    if (!streamRef.current) return;
    
    setStep('speaking');
    setTimeLeft(speakTime);
    
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      await handleAnalysis(blob, mimeType);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalysis = async (audioBlob: Blob, mimeType: string) => {
    setStep('analyzing');
    
    if (audioBlob.size === 0) {
      setError('Recording failed: No audio data captured.');
      return;
    }

    try {
      const base64Data = await blobToBase64(audioBlob);
      const simpleMimeType = mimeType.split(';')[0];

      const analysisPromise = analyzeSpeech(base64Data, simpleMimeType, {
        goals: user?.goals || [],
        experienceLevel: user?.experienceLevel || '',
        weakness: user?.weakness || '',
        context: `The user is practicing impromptu speaking on the topic: "${topic}".`,
        includeContentAnalysis: false
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out (30s limit).')), 30000)
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      const audioUrl = URL.createObjectURL(audioBlob);

      const sessionData = {
        id: Date.now().toString(),
        duration: speakTime - timeLeft, // Actual duration might be slightly less if stopped early
        score: result.score,
        transcript: result.transcript,
        feedback: result.feedback,
        audioData: base64Data,
        audioUrl
      };

      await addSession(sessionData);
      navigate(`/feedback/${sessionData.id}`);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze speech.');
      setStep('config'); // Reset to start on error
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        to="/practice/structured" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Structured Practice
      </Link>

      <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
        <AnimatePresence mode="wait">
          {step === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg glass-card p-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
                  <Shuffle className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Random Topic Challenge</h1>
                <p className="text-zinc-400">
                  Speak on a randomly selected topic. Choose your prep time and speaking duration.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-6">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Preparation Time</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 15, 30, 60].map((t) => (
                      <button
                        key={t}
                        onClick={() => setPrepTime(t)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          prepTime === t 
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {t === 0 ? 'None' : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Speaking Duration</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[30, 60, 90, 120].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSpeakTime(t)}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${
                          speakTime === t 
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {t >= 60 ? `${t/60}m` : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startPrep}
                  className="w-full py-4 rounded-full bg-green-600 text-white font-bold text-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-green-900/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Challenge
                </button>
              </div>
            </motion.div>
          )}

          {step === 'prep' && (
            <motion.div
              key="prep"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-3xl"
            >
              <div className="mb-12">
                <span className="inline-block px-4 py-1 rounded-full bg-green-500/10 text-green-400 font-medium tracking-wider uppercase text-sm mb-4 border border-green-500/20">
                  Your Topic
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">
                  {topic}
                </h2>
              </div>

              <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-zinc-900"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - timeLeft / prepTime)}
                    className="text-green-500 transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col items-center absolute inset-0 justify-center">
                  <span className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Prep Time</span>
                  <span className="text-7xl font-mono font-bold text-white tabular-nums">{timeLeft}</span>
                </div>
              </div>

              <button
                onClick={startSpeaking}
                className="px-8 py-4 rounded-full bg-green-600 hover:bg-green-500 text-white font-medium transition-colors shadow-lg shadow-green-900/20"
              >
                Skip Prep & Start Speaking
              </button>
            </motion.div>
          )}

          {step === 'speaking' && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-3xl"
            >
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-zinc-300 mb-4">{topic}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="font-medium uppercase tracking-wider text-xs">Recording</span>
                </div>
              </div>

              <div className="relative mb-16">
                <div className="text-9xl font-mono font-bold text-white tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-zinc-500 mt-4 text-lg">Time Remaining</p>
              </div>

              <button
                onClick={stopRecording}
                className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all mx-auto group"
              >
                <Square className="w-10 h-10 text-white fill-current group-hover:scale-90 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Analyzing Session...</h2>
                <p className="text-zinc-400 text-lg">Reviewing your response to "{topic}"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
