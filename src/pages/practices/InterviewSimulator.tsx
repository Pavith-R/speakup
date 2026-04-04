import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Mic, Square, Loader2, AlertCircle, Briefcase, FileText, Play, CheckCircle, Sparkles } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { analyzeSpeech, generateInterviewQuestions, AnalysisResult } from '../../services/gemini';

type Step = 'config' | 'generating' | 'prep' | 'speaking' | 'analyzing';

export default function InterviewSimulator() {
  const navigate = useNavigate();
  const { addSession, user } = useUser();
  
  const [step, setStep] = useState<Step>('config');
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Fixed times for now
  const prepTime = 30;
  const speakTime = 120; // 2 minutes

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

  const startSimulation = async () => {
    setError(null);
    setStep('generating');
    setResults([]);
    setCurrentQuestionIndex(0);
    
    try {
      // Request mic permission early
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const generatedQuestions = await generateInterviewQuestions(jobDescription, resume);
      setQuestions(generatedQuestions);
      
      setTimeLeft(prepTime);
      setStep('prep');
    } catch (err) {
      console.error('Error starting simulation:', err);
      setError('Could not access microphone or generate questions. Please try again.');
      setStep('config');
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

      const currentQuestion = questions[currentQuestionIndex];

      const analysisPromise = analyzeSpeech(base64Data, simpleMimeType, {
        goals: user?.goals || [],
        experienceLevel: user?.experienceLevel || '',
        weakness: user?.weakness || '',
        context: `The user is answering interview question ${currentQuestionIndex + 1} of 3: "${currentQuestion}". Job Description: ${jobDescription || 'General'}.`
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timed out (30s limit).')), 30000)
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      const newResults = [...results, result];
      setResults(newResults);
      
      const newAudioBlobs = [...audioBlobs, audioBlob];
      setAudioBlobs(newAudioBlobs);

      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(prepTime);
        setStep('prep');
      } else {
        // All questions done, finish session
        await finishSession(newResults, newAudioBlobs);
      }

    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze speech.');
      // If analysis fails, we might want to let them retry or skip?
      // For now, reset to config to avoid stuck state
      setStep('config');
    }
  };

  const finishSession = async (finalResults: AnalysisResult[], finalAudioBlobs: Blob[]) => {
    // Aggregate results
    const totalScore = finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length;
    const totalDuration = finalResults.reduce((sum, r) => sum + 120, 0); // Approximation, or track actual duration
    
    // Combine transcripts
    const combinedTranscript = finalResults.map((r, i) => 
      `Question ${i + 1}: ${questions[i]}\n\nAnswer: ${r.transcript}`
    ).join('\n\n---\n\n');

    // Combine feedback (average scores)
    const combinedSummary = finalResults
      .map((r, i) => r.feedback.contentAnalysis ? `Q${i + 1}: ${r.feedback.contentAnalysis.summary}` : '')
      .filter(Boolean)
      .join('\n\n');

    const combinedStrengths = finalResults
      .flatMap(r => r.feedback.contentAnalysis?.strengths || [])
      .slice(0, 6); // Limit to top 6

    const combinedImprovements = finalResults
      .flatMap(r => r.feedback.contentAnalysis?.improvements || [])
      .slice(0, 6); // Limit to top 6

    // Calculate average hiring probability if available
    const hiringProbs = finalResults
      .map(r => r.feedback.contentAnalysis?.hiringProbability)
      .filter((p): p is number => typeof p === 'number');
    
    const avgHiringProb = hiringProbs.length > 0 
      ? Math.round(hiringProbs.reduce((a, b) => a + b, 0) / hiringProbs.length)
      : undefined;

    const avgFeedback = {
      clarity: finalResults.reduce((sum, r) => sum + r.feedback.clarity, 0) / finalResults.length,
      pacing: finalResults.reduce((sum, r) => sum + r.feedback.pacing, 0) / finalResults.length,
      wpm: finalResults.reduce((sum, r) => sum + r.feedback.wpm, 0) / finalResults.length,
      fillerWords: finalResults.reduce((sum, r) => sum + r.feedback.fillerWords, 0),
      structure: finalResults.reduce((sum, r) => sum + r.feedback.structure, 0) / finalResults.length,
      tips: finalResults.flatMap(r => r.feedback.tips).slice(0, 5), // Take top 5 tips
      contentAnalysis: combinedSummary ? {
        summary: combinedSummary,
        strengths: combinedStrengths,
        improvements: combinedImprovements,
        hiringProbability: avgHiringProb
      } : undefined
    };

    let audioUrl = undefined;
    let audioData = undefined;
    if (finalAudioBlobs && finalAudioBlobs.length > 0) {
      const combinedBlob = new Blob(finalAudioBlobs, { type: finalAudioBlobs[0].type });
      audioUrl = URL.createObjectURL(combinedBlob);
      audioData = await blobToBase64(combinedBlob);
    }

    const sessionData = {
      id: Date.now().toString(),
      duration: totalDuration,
      score: Math.round(totalScore),
      transcript: combinedTranscript,
      feedback: avgFeedback,
      audioData,
      audioUrl
    };

    await addSession(sessionData);
    
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    navigate(`/feedback/${sessionData.id}`);
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-6">
                  <Briefcase className="w-8 h-8 text-orange-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Interview Simulator</h1>
                <p className="text-zinc-400">
                  Practice answering 3 tailored interview questions based on your target role.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-6">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 text-orange-400" />
                    Job Title / Description (Optional)
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="e.g. Senior Product Manager at TechCorp..."
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-orange-400" />
                    Resume / Experience (Optional)
                  </label>
                  <textarea
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste your resume or summary of experience here..."
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={startSimulation}
                    className="w-full py-4 rounded-full bg-orange-600 text-white font-bold text-lg hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {jobDescription || resume ? 'Generate Custom Interview' : 'Start General Interview'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-orange-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Generating Interview...</h2>
                <p className="text-zinc-400 text-lg">Reviewing your profile and preparing 3 questions.</p>
              </div>
            </motion.div>
          )}

          {step === 'prep' && (
            <motion.div
              key={`prep-${currentQuestionIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-3xl"
            >
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              
              <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 leading-tight tracking-tight">
                  "{questions[currentQuestionIndex]}"
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
                    className="text-orange-500 transition-all duration-1000 ease-linear"
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
                className="px-8 py-4 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors shadow-lg shadow-orange-900/20"
              >
                Skip Prep & Start Answering
              </button>
            </motion.div>
          )}

          {step === 'speaking' && (
            <motion.div
              key={`speaking-${currentQuestionIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-3xl"
            >
              <div className="mb-4">
                <span className="text-zinc-500 text-sm uppercase tracking-wider font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              
              <div className="mb-12">
                <h2 className="text-2xl font-medium text-zinc-300 mb-6">"{questions[currentQuestionIndex]}"</h2>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="font-medium uppercase tracking-wider text-xs">Recording Answer</span>
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
                <h2 className="text-3xl font-bold text-white">
                  {currentQuestionIndex < questions.length - 1 
                    ? "Saving Response..." 
                    : "Finalizing Interview..."}
                </h2>
                <p className="text-zinc-400 text-lg">
                  {currentQuestionIndex < questions.length - 1
                    ? "Processing your answer before the next question."
                    : "Compiling your results and feedback."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
