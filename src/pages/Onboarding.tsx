import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';

const goals = [
  { id: 'interviews', label: 'Job Interviews', icon: '💼' },
  { id: 'presentations', label: 'Presentations', icon: '🎤' },
  { id: 'confidence', label: 'Confidence', icon: '🦁' },
  { id: 'clarity', label: 'Clarity', icon: '🗣️' },
];

const experienceLevels = [
  { id: 'beginner', label: 'Beginner', description: 'I get nervous and lose my train of thought.' },
  { id: 'intermediate', label: 'Intermediate', description: 'I can speak well but want to polish my skills.' },
  { id: 'advanced', label: 'Advanced', description: 'I want to master public speaking.' },
];

const weaknesses = [
  { id: 'pacing', label: 'Pacing (Too fast/slow)', icon: '⏱️' },
  { id: 'fillers', label: 'Filler Words (Um, Ah)', icon: '🤔' },
  { id: 'structure', label: 'Structure & Flow', icon: '📝' },
  { id: 'anxiety', label: 'Nervousness', icon: '😰' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [weakness, setWeakness] = useState('');
  const { updateProfile } = useUser();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      updateProfile({
        goals: selectedGoals,
        experienceLevel: experience,
        weakness: weakness,
        isOnboarded: true,
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleGoal = (id: string) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(g => g !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-6" /> // Spacer
          )}
          
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-2 w-12 rounded-full transition-colors ${i <= step ? 'bg-electric-blue' : 'bg-navy-800'}`} 
              />
            ))}
          </div>
          
          <div className="w-6" /> // Spacer
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                What do you want to improve?
              </h1>
              <p className="text-center text-slate-400 mb-8">Select all that apply.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-6 rounded-xl border-2 transition-all flex items-center gap-4 text-left group
                      ${selectedGoals.includes(goal.id) 
                        ? 'border-electric-blue bg-electric-blue/10' 
                        : 'border-navy-800 bg-navy-900 hover:border-navy-700'}`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className={`text-lg font-medium ${selectedGoals.includes(goal.id) ? 'text-electric-blue' : 'text-slate-300'}`}>
                      {goal.label}
                    </span>
                    {selectedGoals.includes(goal.id) && (
                      <Check className="ml-auto w-5 h-5 text-electric-blue" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                What's your experience level?
              </h1>
              <p className="text-center text-slate-400 mb-8">Be honest, we'll tailor the feedback.</p>
              
              <div className="space-y-4">
                {experienceLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left group
                      ${experience === level.id 
                        ? 'border-electric-blue bg-electric-blue/10' 
                        : 'border-navy-800 bg-navy-900 hover:border-navy-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-lg font-medium ${experience === level.id ? 'text-electric-blue' : 'text-slate-300'}`}>
                        {level.label}
                      </span>
                      {experience === level.id && (
                        <Check className="w-5 h-5 text-electric-blue" />
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{level.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-2">
                What's your biggest challenge?
              </h1>
              <p className="text-center text-slate-400 mb-8">We'll focus on this first.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {weaknesses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWeakness(w.id)}
                    className={`p-6 rounded-xl border-2 transition-all flex items-center gap-4 text-left group
                      ${weakness === w.id 
                        ? 'border-electric-blue bg-electric-blue/10' 
                        : 'border-navy-800 bg-navy-900 hover:border-navy-700'}`}
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <span className={`text-lg font-medium ${weakness === w.id ? 'text-electric-blue' : 'text-slate-300'}`}>
                      {w.label}
                    </span>
                    {weakness === w.id && (
                      <Check className="ml-auto w-5 h-5 text-electric-blue" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-center">
          <button
            onClick={handleNext}
            disabled={
              (step === 0 && selectedGoals.length === 0) ||
              (step === 1 && !experience) ||
              (step === 2 && !weakness)
            }
            className="bg-electric-blue hover:bg-electric-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-bold py-4 px-12 rounded-full transition-all flex items-center gap-2 text-lg shadow-lg shadow-electric-blue/20"
          >
            {step === 2 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
