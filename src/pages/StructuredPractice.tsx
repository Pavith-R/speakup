import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shuffle, ArrowRight, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

export default function StructuredPractice() {
  const practices = [
    {
      id: 'random-topic',
      title: 'Random Topic Challenge',
      description: 'Practice impromptu speaking by talking about a random subject for a set duration.',
      icon: Shuffle,
      link: '/practice/structured/random-topic',
      glowColor: 'bg-green-500/20',
      iconBg: 'bg-green-500/10',
      iconBorder: 'border-green-500/20',
      iconColor: 'text-green-400',
      hoverBorder: 'hover:border-green-500/50',
      hoverText: 'group-hover:text-green-400',
      buttonBg: 'bg-green-600',
      buttonHover: 'hover:bg-green-500',
      buttonShadow: 'shadow-green-900/20'
    },
    {
      id: 'interview-simulator',
      title: 'Interview Simulator',
      description: 'Practice answering tailored interview questions based on a job description and your resume.',
      icon: Briefcase,
      link: '/practice/structured/interview',
      glowColor: 'bg-orange-500/20',
      iconBg: 'bg-orange-500/10',
      iconBorder: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      hoverBorder: 'hover:border-orange-500/50',
      hoverText: 'group-hover:text-orange-400',
      buttonBg: 'bg-orange-600',
      buttonHover: 'hover:bg-orange-500',
      buttonShadow: 'shadow-orange-900/20'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Link 
        to="/practice" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Practice
      </Link>

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Structured Practice</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Choose a guided exercise to improve specific speaking skills.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {practices.map((practice) => (
          <Link key={practice.id} to={practice.link} className="group relative block">
            <motion.div 
              whileHover={{ scale: 1.01, y: -2 }}
              className={`glass-card p-8 flex flex-col sm:flex-row items-center gap-8 transition-all border-zinc-800 ${practice.hoverBorder} relative overflow-hidden`}
            >
              {/* Glow Effect */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 ${practice.glowColor} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`w-16 h-16 rounded-xl ${practice.iconBg} border ${practice.iconBorder} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                <practice.icon className={`w-8 h-8 ${practice.iconColor}`} />
              </div>
              
              <div className="flex-grow text-center sm:text-left relative z-10">
                <h3 className={`text-2xl font-bold text-white mb-2 ${practice.hoverText} transition-colors`}>
                  {practice.title}
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  {practice.description}
                </p>
              </div>

              <div className={`flex items-center gap-2 text-white font-semibold ${practice.buttonBg} px-6 py-3 rounded-full ${practice.buttonHover} transition-all shadow-lg ${practice.buttonShadow} relative z-10 whitespace-nowrap`}>
                Start <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
