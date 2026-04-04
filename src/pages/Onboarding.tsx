import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  const { updateProfile, user, isAuthReady } = useUser();
  const navigate = useNavigate();

  if (!isAuthReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-12 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={handleBack} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10" /> // Spacer
          )}
          
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= step ? 'w-12 bg-white' : 'w-3 bg-zinc-800'
                }`} 
              />
            ))}
          </div>
          
          <div className="w-10" /> // Spacer
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  What do you want to improve?
                </h1>
                <p className="text-lg text-zinc-400">Select all that apply.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-6 rounded-xl border transition-all flex items-center gap-4 text-left group
                      ${selectedGoals.includes(goal.id) 
                        ? 'bg-zinc-900 border-white text-white' 
                        : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                  >
                    <span className="text-3xl filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{goal.icon}</span>
                    <span className="text-lg font-medium">
                      {goal.label}
                    </span>
                    {selectedGoals.includes(goal.id) && (
                      <div className="ml-auto bg-white rounded-full p-1">
                        <Check className="w-3 h-3 text-black" />
                      </div>
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
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  What's your experience level?
                </h1>
                <p className="text-lg text-zinc-400">Be honest, we'll tailor the feedback.</p>
              </div>
              
              <div className="space-y-4">
                {experienceLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`w-full p-6 rounded-xl border transition-all text-left group
                      ${experience === level.id 
                        ? 'bg-zinc-900 border-white text-white' 
                        : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold">
                        {level.label}
                      </span>
                      {experience === level.id && (
                        <div className="bg-white rounded-full p-1">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                    <p className={`text-base transition-colors ${experience === level.id ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{level.description}</p>
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
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  What's your biggest challenge?
                </h1>
                <p className="text-lg text-zinc-400">We'll focus on this first.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {weaknesses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWeakness(w.id)}
                    className={`p-6 rounded-xl border transition-all flex items-center gap-4 text-left group
                      ${weakness === w.id 
                        ? 'bg-zinc-900 border-white text-white' 
                        : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                  >
                    <span className="text-3xl filter grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{w.icon}</span>
                    <span className="text-lg font-medium">
                      {w.label}
                    </span>
                    {weakness === w.id && (
                      <div className="ml-auto bg-white rounded-full p-1">
                        <Check className="w-3 h-3 text-black" />
                      </div>
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
            className="bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed font-bold py-4 px-12 rounded-full transition-all hover:bg-zinc-200 flex items-center gap-3 text-lg"
          >
            {step === 2 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
