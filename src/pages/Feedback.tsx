import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, BarChart2, Mic, ArrowRight, Clock } from 'lucide-react';

export default function Feedback() {
  const { id } = useParams();
  const { sessions } = useUser();
  const session = sessions.find(s => s.id === id);

  if (!session) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Session not found</h2>
        <Link to="/dashboard" className="text-electric-blue hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const { score, feedback } = session;

  if (!feedback) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Incomplete Analysis</h2>
        <p className="text-slate-400 mb-6">The feedback data for this session seems to be missing.</p>
        <Link to="/dashboard" className="text-electric-blue hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-400';
    if (s >= 70) return 'text-electric-blue';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analysis Complete</h1>
          <p className="text-slate-400">Here's how you did on your {session.duration}s speech.</p>
        </div>
        <div className="flex gap-4">
          <Link 
            to="/practice/free" 
            className="px-6 py-3 rounded-lg border border-navy-700 hover:bg-navy-800 transition-colors text-slate-300 font-medium flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Try Again
          </Link>
          <Link 
            to="/dashboard" 
            className="px-6 py-3 rounded-lg bg-electric-blue hover:bg-electric-blue-dark text-navy-950 font-bold transition-colors flex items-center gap-2"
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
          className="bg-navy-900 border border-navy-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white" />
          <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-4">Overall Score</h3>
          <div className={`text-7xl font-bold mb-2 ${getScoreColor(score || 0)}`}>
            {score || 0}
          </div>
          <div className="text-sm text-slate-500">out of 100</div>
        </motion.div>

        {/* Detailed Metrics */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard 
            title="Clarity" 
            value={feedback.clarity} 
            icon={<CheckCircle className="w-5 h-5 text-electric-blue" />} 
            description="How clearly you enunciated words."
          />
          <MetricCard 
            title="Pacing" 
            value={feedback.pacing} 
            icon={<BarChart2 className="w-5 h-5 text-white" />} 
            description="Speed and rhythm of speech."
          />
          <MetricCard 
            title="Words / Min" 
            value={feedback.wpm || 0} 
            icon={<Clock className="w-5 h-5 text-green-400" />} 
            description="Average speaking speed."
            suffix=""
          />
          <MetricCard 
            title="Structure" 
            value={feedback.structure} 
            icon={<AlertCircle className="w-5 h-5 text-yellow-400" />} 
            description="Logical flow of ideas."
          />
          <MetricCard 
            title="Filler Words" 
            value={feedback.fillerWords} 
            inverse 
            icon={<Mic className="w-5 h-5 text-red-400" />} 
            description="Um, ah, like, you know."
            suffix=" words"
          />
        </div>
      </div>

      {/* Actionable Tips */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="bg-electric-blue/20 p-2 rounded-lg text-electric-blue">💡</span>
          Actionable Tips
        </h3>
        <div className="space-y-4">
          {feedback.tips.map((tip, index) => (
            <motion.div 
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className="flex items-start gap-4 p-4 bg-navy-950 rounded-xl border border-navy-800"
            >
              <div className="bg-navy-800 text-slate-300 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                {index + 1}
              </div>
              <p className="text-slate-300 leading-relaxed">{tip}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="bg-electric-blue/20 p-2 rounded-lg text-electric-blue">📝</span>
          Transcript
        </h3>
        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-navy-950 p-6 rounded-xl border border-navy-800">
          {session.transcript ? (
            session.transcript
          ) : (
            <span className="text-slate-500 italic">No transcript available for this session.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, description, inverse = false, suffix = '%' }: any) {
  // Ensure value is a number, default to 0 if NaN or undefined
  const safeValue = isNaN(Number(value)) ? 0 : Number(value);
  
  // For inverse metrics (like filler words), lower is better
  const percentage = inverse ? Math.max(0, 100 - (safeValue * 5)) : safeValue;
  
  return (
    <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 hover:border-navy-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-slate-200">{title}</h4>
        </div>
        <span className="text-2xl font-bold text-white">
          {safeValue}{suffix}
        </span>
      </div>
      
      <div className="w-full bg-navy-950 rounded-full h-2 mb-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${inverse ? 'bg-red-400' : 'bg-electric-blue'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
