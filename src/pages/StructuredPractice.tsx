import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Mic, Shuffle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function StructuredPractice() {
  const practices = [
    {
      id: 'random-topic',
      title: 'Random Topic Challenge',
      description: 'Practice impromptu speaking by talking about a random subject for a set duration.',
      icon: Shuffle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'hover:border-yellow-500',
      shadowColor: 'hover:shadow-yellow-500/10',
      link: '/practice/structured/random-topic'
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
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Practice
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Structured Practice</h1>
        <p className="text-slate-400">Choose a guided exercise to improve specific speaking skills.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {practices.map((practice) => (
          <Link key={practice.id} to={practice.link} className="group">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className={`bg-navy-900 border border-navy-800 rounded-xl p-6 flex items-center gap-6 transition-all shadow-lg ${practice.borderColor} ${practice.shadowColor}`}
            >
              <div className={`w-16 h-16 ${practice.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <practice.icon className={`w-8 h-8 ${practice.color}`} />
              </div>
              
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-electric-blue transition-colors">
                  {practice.title}
                </h3>
                <p className="text-slate-400">
                  {practice.description}
                </p>
              </div>

              <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-navy-800 group-hover:bg-electric-blue group-hover:text-navy-950 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
