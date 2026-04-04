import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, BookOpen, ArrowRight, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';

export default function PracticeHub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 py-12">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          Choose Your Practice Mode
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Select how you want to improve today. Whether it's free-flowing speech or targeted exercises, we've got you covered.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
        {/* Free Speak Card */}
        <Link to="/practice/free" className="group relative block h-full">
          <motion.div 
            whileHover={{ y: -2 }}
            className="glass-card p-10 h-full flex flex-col items-start text-left relative overflow-hidden border-zinc-800 hover:border-purple-500/50 transition-colors"
          >
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors duration-500" />
            
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10 group-hover:text-purple-400 transition-colors">Free Speak</h2>
            <p className="text-zinc-400 text-lg mb-8 flex-grow leading-relaxed relative z-10">
              Talk about any topic freely. Get instant AI feedback on your pacing, clarity, filler words, and tone.
            </p>
            
            <div className="flex items-center gap-3 text-white font-semibold bg-purple-600 px-6 py-3 rounded-full hover:bg-purple-500 transition-all w-full justify-center relative z-10 shadow-lg shadow-purple-900/20">
              Start Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>

        {/* Structured Practice Card */}
        <Link to="/practice/structured" className="group relative block h-full">
          <motion.div 
            whileHover={{ y: -2 }}
            className="glass-card p-10 h-full flex flex-col items-start text-left relative overflow-hidden border-zinc-800 hover:border-blue-500/50 transition-colors"
          >
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-500" />

            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4 relative z-10 group-hover:text-blue-400 transition-colors">Structured Practice</h2>
            <p className="text-zinc-400 text-lg mb-8 flex-grow leading-relaxed relative z-10">
              Follow guided exercises designed to target specific skills like impromptu speaking, storytelling, and interviews.
            </p>
            
            <div className="flex items-center gap-3 text-white font-semibold bg-blue-600 px-6 py-3 rounded-full hover:bg-blue-500 transition-all w-full justify-center relative z-10 shadow-lg shadow-blue-900/20">
              Browse Exercises <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
