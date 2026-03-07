import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mic } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    login(email, name || email.split('@')[0]);
    // Navigation will be handled by the useEffect above
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-electric-blue/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-navy-900 border border-navy-800 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center border border-navy-700">
            <Mic className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-100">
          {isLogin ? 'Welcome Back' : 'Join SpeakUp'}
        </h2>
        <p className="text-center text-slate-400 mb-8">
          {isLogin ? 'Sign in to continue your journey' : 'Start improving your speaking skills today'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
                placeholder="Your Name"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-950 border border-navy-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-electric-blue hover:bg-electric-blue-dark text-navy-950 font-bold py-3 rounded-lg transition-colors mt-6"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400 hover:text-electric-blue transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
