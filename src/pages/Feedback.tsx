import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, BarChart2, Mic, ArrowRight, Clock, ChevronDown, Sparkles, Activity, Brain, PlayCircle } from 'lucide-react';
import WaveformPlayer from '../components/WaveformPlayer';

export default function Feedback() {
  const { id } = useParams();
  const { sessions } = useUser();
  const session = sessions.find(s => s.id === id);
  const [wavesurferInstance, setWavesurferInstance] = useState<any>(null);

  if (!session) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Session not found</h2>
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const { score, feedback } = session;

  if (!feedback) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-white mb-4">Incomplete Analysis</h2>
        <p className="text-slate-400 mb-6 text-lg">The feedback data for this session seems to be missing.</p>
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-400';
    if (s >= 70) return 'text-indigo-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleTipClick = (timestamp?: string) => {
    if (!timestamp || !wavesurferInstance) return;
    
    // Parse MM:SS to seconds
    const parts = timestamp.split(':');
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 1) {
      seconds = parseInt(parts[0], 10);
    }
    
    if (!isNaN(seconds)) {
      wavesurferInstance.setTime(seconds);
      wavesurferInstance.play();
      
      // Scroll to the player
      const playerElement = document.getElementById('waveform-player-section');
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium mb-2">
            <Sparkles className="w-3 h-3" />
            Analysis Complete
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Session Feedback</h1>
          <p className="text-zinc-400 text-lg">Here's how you did on your {session.duration}s speech.</p>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/practice/free" 
            className="px-6 py-3 rounded-full border border-zinc-800 hover:bg-zinc-900 transition-colors text-zinc-300 font-medium flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Try Again
          </Link>
          <Link 
            to="/dashboard" 
            className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group"
        >
          <div className="relative z-10">
            <h3 className="text-zinc-400 font-medium uppercase tracking-wider text-sm mb-6">Overall Score</h3>
            <div className="relative inline-block">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-zinc-900"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - (score || 0) / 100)}
                  className="text-white"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-white">
                  {Math.round(score || 0)}
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-zinc-500">out of 100</div>
          </div>
        </motion.div>

        {/* Detailed Metrics */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard 
            title="Clarity" 
            value={feedback.clarity} 
            icon={<CheckCircle className="w-5 h-5 text-white" />} 
            description="How clearly you enunciated words."
            color="bg-white"
          />
          <MetricCard 
            title="Pacing" 
            value={feedback.pacing} 
            icon={<Activity className="w-5 h-5 text-white" />} 
            description="Speed and rhythm of speech."
            color="bg-white"
          />
          <MetricCard 
            title="Words / Min" 
            value={feedback.wpm || 0} 
            icon={<Clock className="w-5 h-5 text-white" />} 
            description="Average speaking speed."
            suffix=""
            color="bg-white"
          />
          <MetricCard 
            title="Structure" 
            value={feedback.structure} 
            icon={<BarChart2 className="w-5 h-5 text-white" />} 
            description="Logical flow of ideas."
            color="bg-white"
          />
          <MetricCard 
            title="Filler Words" 
            value={feedback.fillerWords} 
            inverse 
            icon={<Mic className="w-5 h-5 text-white" />} 
            description="Um, ah, like, you know."
            suffix=" words"
            isInteger
            color="bg-white"
          />
        </div>
      </div>

      {/* Content Analysis */}
      {feedback.contentAnalysis && (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-6 h-6 text-zinc-400" />
              Content Analysis
            </h3>
            
            {typeof feedback.contentAnalysis.hiringProbability === 'number' && (
              <div className="flex items-center gap-3 bg-zinc-900 px-5 py-2.5 rounded-lg border border-zinc-800">
                <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Hiring Probability</span>
                <span className="text-2xl font-bold text-white">
                  {feedback.contentAnalysis.hiringProbability}%
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <h4 className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-3">Summary</h4>
              <p className="text-zinc-200 text-lg leading-relaxed">{feedback.contentAnalysis.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                  <CheckCircle className="w-5 h-5" />
                  What You Did Well
                </h4>
                <ul className="space-y-3">
                  {feedback.contentAnalysis.strengths.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                  <AlertCircle className="w-5 h-5" />
                  What To Avoid
                </h4>
                <ul className="space-y-3">
                  {feedback.contentAnalysis.improvements.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actionable Tips */}
      {feedback.tips && feedback.tips.length > 0 && (
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-zinc-400" />
            Actionable Tips
          </h3>
          <div className="space-y-4">
            {feedback.tips.map((tip: any, index: number) => {
              // Handle both new object format and old string format for backward compatibility
              const isObject = typeof tip === 'object' && tip !== null;
              const text = isObject ? tip.text : tip;
              const example = isObject ? tip.example : null;
              const timestamp = isObject ? tip.timestamp : null;

              return (
                <motion.div 
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  className="flex items-start gap-4 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="text-zinc-300 text-lg leading-relaxed mb-2">{text}</p>
                    
                    {example && (
                      <div className="mt-3 bg-black/50 border border-zinc-800 rounded-lg p-4">
                        <p className="text-zinc-400 italic text-sm mb-2">"{example}"</p>
                        {timestamp && session.audioUrl && (
                          <button 
                            onClick={() => handleTipClick(timestamp)}
                            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Play from {timestamp}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="glass-card p-8" id="waveform-player-section">
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <Mic className="w-6 h-6 text-zinc-400" />
          Transcript
        </h3>
        
        {session.audioUrl && (
          <WaveformPlayer 
            audioUrl={session.audioUrl} 
            onReady={(ws) => setWavesurferInstance(ws)}
          />
        )}

        <div className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap bg-black p-8 rounded-xl border border-zinc-800 font-mono">
          {session.transcript ? (
            session.transcript
          ) : (
            <span className="text-zinc-500 italic">No transcript available for this session.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, description, inverse = false, suffix = '%', isInteger = false, color = 'bg-white' }: any) {
  const safeValue = isNaN(Number(value)) ? 0 : Number(value);
  const percentage = inverse ? Math.max(0, 100 - (safeValue * 5)) : safeValue;
  
  const formattedValue = isInteger 
    ? Math.round(safeValue) 
    : Number.isInteger(safeValue) ? safeValue : safeValue.toFixed(2);

  return (
    <div className="glass-card p-6 hover:bg-zinc-900 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white">
            {icon}
          </div>
          <h4 className="font-semibold text-zinc-200">{title}</h4>
        </div>
        <span className="text-2xl font-bold text-white">
          {formattedValue}{suffix}
        </span>
      </div>
      
      <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</p>
    </div>
  );
}
