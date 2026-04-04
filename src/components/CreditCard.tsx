import React from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

interface CreditCardProps {
  balance: string;
  number: string;
  expiry: string;
  type: 'visa' | 'mastercard';
  color: 'green' | 'black' | 'purple';
}

export function CreditCard({ balance, number, expiry, type, color }: CreditCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const bgColors = {
    green: 'bg-lime-400 text-black',
    black: 'bg-gray-900 text-white',
    purple: 'bg-purple-600 text-white',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative w-full aspect-[1.586/1] rounded-3xl p-6 flex flex-col justify-between shadow-xl overflow-hidden ${bgColors[color]}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="2" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80">Current Balance</p>
          <h3 className="text-2xl font-bold mt-1">{balance}</h3>
        </div>
        <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-sm" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-lg tracking-widest">
                {showDetails ? number : `•••• •••• •••• ${number.slice(-4)}`}
              </span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs font-medium opacity-80">EXP {expiry}</p>
          </div>
          <div className="flex flex-col items-end">
             <span className="font-bold text-lg italic">{type.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
