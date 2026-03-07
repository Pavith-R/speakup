import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function PracticeHub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Choose Your Practice Mode</h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Select how you want to improve your speaking skills today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Free Speak Card */}
        <Link to="/practice/free" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-navy-900 border border-navy-800 rounded-2xl p-8 h-full flex flex-col items-center text-center hover:border-electric-blue transition-colors shadow-lg hover:shadow-electric-blue/10"
          >
            <div className="w-20 h-20 bg-electric-blue/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-electric-blue/20 transition-colors">
              <Mic className="w-10 h-10 text-electric-blue" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Free Speak</h2>
            <p className="text-slate-400 mb-8 flex-grow">
              Talk about any topic freely. Get instant feedback on your pacing, clarity, and filler words.
            </p>
            <div className="flex items-center gap-2 text-electric-blue font-medium">
              Start Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>

        {/* Structured Practice Card */}
        <Link to="/practice/structured" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-navy-900 border border-navy-800 rounded-2xl p-8 h-full flex flex-col items-center text-center hover:border-purple-500 transition-colors shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Structured Practice</h2>
            <p className="text-slate-400 mb-8 flex-grow">
              Follow guided exercises designed to target specific skills like impromptu speaking and storytelling.
            </p>
            <div className="flex items-center gap-2 text-purple-400 font-medium">
              Browse Exercises <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
