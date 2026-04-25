import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, Square, Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { analyzeSpeech } from '../services/gemini';

export default function Record() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { addSession, user } = useUser();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
    if (audioBlob.size === 0) {
      setError('Recording failed: No audio data captured.');
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const base64Data = await blobToBase64(audioBlob);
      
      // Strip codecs from mimeType for Gemini API compatibility
      const simpleMimeType = mimeType.split(';')[0];
      
      // Add a timeout to the analysis
      const analysisPromise = analyzeSpeech(base64Data, simpleMimeType, {
        goals: user?.goals || [],
        experienceLevel: user?.experienceLevel || '',
        weakness: user?.weakness || '',
        includeContentAnalysis: false
      });
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out (30s limit). Please check your connection.')), 30000)
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      const audioUrl = URL.createObjectURL(audioBlob);

      const sessionData = {
        id: Date.now().toString(),
        duration,
        score: result.score,
        transcript: result.transcript,
        feedback: result.feedback,
        audioData: base64Data,
        audioUrl // Keep for immediate playback before refresh
      };

      await addSession(sessionData);
      navigate(`/feedback/${sessionData.id}`);
    } catch (err: any) {
      console.error('Analysis failed:', err instanceof Error ? err.message : 'Unknown error');
      setError(err.message || 'Failed to analyze speech. Please try again.');
      setIsAnalyzing(false);
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
        to="/practice" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Practice
      </Link>

      <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
        <AnimatePresence mode="wait">
          {!isAnalyzing ? (
            <motion.div
              key="recording-ui"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-12 w-full max-w-md"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium">
                  <Sparkles className="w-3 h-3" />
                  Free Speak Mode
                </div>
                <h2 className="text-5xl font-bold text-white tracking-tight">
                  {isRecording ? 'Listening...' : 'Ready to Practice?'}
                </h2>
                <p className="text-zinc-400 text-lg">
                  {isRecording ? 'Speak naturally. We are analyzing your speech.' : 'Press the button and start speaking.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="relative group">
                {/* Pulsing rings */}
                {isRecording && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                      className="absolute inset-0 bg-red-500/10 rounded-full blur-lg"
                    />
                  </>
                )}

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-4 shadow-2xl
                    ${isRecording 
                      ? 'bg-red-600 border-red-500 text-white hover:scale-105 shadow-red-900/50' 
                      : 'bg-purple-600 border-purple-500 text-white hover:scale-105 hover:bg-purple-500 shadow-purple-900/50'}`}
                >
                  {isRecording ? (
                    <Square className="w-12 h-12 fill-current" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </button>
              </div>

              <div className="font-mono text-6xl font-medium text-white tabular-nums tracking-wider">
                {formatTime(duration)}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analyzing-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Analyzing Speech...</h2>
                <p className="text-zinc-400 text-lg max-w-md">Transcribing audio and checking for clarity, pacing, and structure.</p>
                <p className="text-zinc-500 text-sm mt-4">This may take a few seconds.</p>
              </div>
              
              <button 
                onClick={() => setIsAnalyzing(false)}
                className="mt-4 text-zinc-400 hover:text-white text-sm underline transition-colors"
              >
                Cancel
              </button>
            </motion.div>

          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
