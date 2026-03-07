import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Mic, Square, Loader2, AlertCircle, RefreshCw, Play } from 'lucide-react';
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
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const handleTimerComplete = () => {
    if (step === 'prep') {
      startSpeaking();
    } else if (step === 'speaking') {
      stopRecording();
    }
  };

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
        context: `The user is practicing impromptu speaking on the topic: "${topic}".`
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out (60s limit).')), 60000)
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      const sessionData = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: speakTime - timeLeft, // Actual duration might be slightly less if stopped early
        score: result.score,
        transcript: result.transcript,
        feedback: result.feedback
      };

      addSession(sessionData);
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
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
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
              className="w-full max-w-lg bg-navy-900 border border-navy-800 rounded-2xl p-8"
            >
              <h1 className="text-3xl font-bold text-white mb-2 text-center">Random Topic Challenge</h1>
              <p className="text-slate-400 text-center mb-8">
                Speak on a randomly selected topic. Choose your prep time and speaking duration.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-6">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Preparation Time</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 15, 30, 60].map((t) => (
                      <button
                        key={t}
                        onClick={() => setPrepTime(t)}
                        className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                          prepTime === t 
                            ? 'bg-electric-blue text-navy-950' 
                            : 'bg-navy-800 text-slate-400 hover:bg-navy-700'
                        }`}
                      >
                        {t === 0 ? 'None' : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Speaking Duration</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[30, 60, 90, 120].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSpeakTime(t)}
                        className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                          speakTime === t 
                            ? 'bg-electric-blue text-navy-950' 
                            : 'bg-navy-800 text-slate-400 hover:bg-navy-700'
                        }`}
                      >
                        {t >= 60 ? `${t/60}m` : `${t}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startPrep}
                  className="w-full py-4 rounded-xl bg-electric-blue hover:bg-electric-blue-dark text-navy-950 font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Play className="w-5 h-5" />
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
              className="text-center w-full max-w-2xl"
            >
              <div className="mb-8">
                <span className="text-electric-blue font-medium tracking-wider uppercase text-sm">Your Topic</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 leading-tight">
                  {topic}
                </h2>
              </div>

              <div className="w-48 h-48 rounded-full border-4 border-navy-800 flex flex-col items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" style={{ animationDuration: `${prepTime}s` }}></div>
                <span className="text-sm text-slate-400 uppercase tracking-wider mb-1">Prep Time</span>
                <span className="text-5xl font-mono font-bold text-yellow-500">{timeLeft}</span>
              </div>

              <button
                onClick={startSpeaking}
                className="px-8 py-3 rounded-full bg-navy-800 hover:bg-navy-700 text-white font-medium transition-colors"
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
              className="text-center w-full max-w-2xl"
            >
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-300 mb-2">{topic}</h2>
                <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-medium uppercase tracking-wider text-sm">Recording</span>
                </div>
              </div>

              <div className="relative mb-12">
                <div className="text-8xl font-mono font-bold text-white tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-slate-500 mt-2">Time Remaining</p>
              </div>

              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/30 mx-auto"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-navy-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-electric-blue rounded-full border-t-transparent animate-spin"></div>
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-electric-blue animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-electric-blue mb-2">Analyzing Session...</h2>
                <p className="text-electric-blue-dark">Reviewing your response to "{topic}"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
