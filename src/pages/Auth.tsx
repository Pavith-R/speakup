import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mic, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { login, user, isAuthReady } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  if (!isAuthReady || user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login();
    } catch (err: any) {
      if (
        err.code === 'auth/popup-closed-by-user' || 
        err.code === 'auth/user-cancelled' || 
        err.code === 'auth/cancelled-popup-request'
      ) {
        // User intentionally closed the popup, clear the error
        setError(null);
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Mic className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2 text-white">
          Welcome to SpeakUp
        </h2>
        <p className="text-center text-zinc-400 mb-8">
          Sign in to start improving your speaking skills today
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white text-black font-semibold py-4 rounded-full transition-all hover:bg-zinc-200 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="mt-8 text-center text-xs text-zinc-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</a>.
        </div>
      </motion.div>
    </div>
  );
}
