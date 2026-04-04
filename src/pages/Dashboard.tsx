import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { motion } from 'motion/react';
import { Plus, BarChart2, Calendar, Clock, TrendingUp, Activity, Timer, ArrowRight, Flame } from 'lucide-react';

export default function Dashboard() {
  const { user, sessions } = useUser();

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      date: format(new Date(s.date), 'MMM d'),
      score: s.score,
    }));

  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / sessions.length) 
    : 0;

  const totalDuration = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0) / 60) 
    : 0;

  const calculateStreak = () => {
    if (sessions.length === 0) return 0;

    const uniqueDates = [...new Set<number>(sessions.map(s => startOfDay(new Date(s.date)).getTime()))]
      .map(time => new Date(time))
      .sort((a, b) => b.getTime() - a.getTime());

    const today = startOfDay(new Date());
    let streak = 0;
    
    // Check if first date is today or yesterday
    const diffFirst = differenceInDays(today, uniqueDates[0]);
    if (diffFirst === 0 || diffFirst === 1) {
      streak = 1;
      let lastDate = uniqueDates[0];
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const diff = differenceInDays(lastDate, uniqueDates[i]);
        if (diff === 1) {
          streak++;
          lastDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const [visibleSessions, setVisibleSessions] = useState(5);

  const handleLoadMore = () => {
    setVisibleSessions(prev => prev + 5);
  };

  const currentStreak = calculateStreak();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-zinc-400 text-lg">Here's your progress so far.</p>
        </div>
        <Link 
          to="/practice" 
          className="px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold transition-all hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-900/20"
        >
          <Plus className="w-5 h-5" />
          New Session
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-card p-6 relative overflow-hidden group border-zinc-800 hover:border-blue-500/50 transition-colors"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-zinc-400 group-hover:text-blue-400 transition-colors">
              <Activity className="w-5 h-5" />
              <span className="font-medium text-sm uppercase tracking-wider">Total Sessions</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{sessions.length}</div>
            <div className="text-sm text-zinc-500">Lifetime practice sessions</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-card p-6 relative overflow-hidden group border-zinc-800 hover:border-green-500/50 transition-colors"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-green-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-zinc-400 group-hover:text-green-400 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium text-sm uppercase tracking-wider">Avg. Score</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{averageScore}</div>
            <div className="text-sm text-zinc-500">Average performance score</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-card p-6 relative overflow-hidden group border-zinc-800 hover:border-orange-500/50 transition-colors"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-zinc-400 group-hover:text-orange-400 transition-colors">
              <Timer className="w-5 h-5" />
              <span className="font-medium text-sm uppercase tracking-wider">Practice Time</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {totalDuration}<span className="text-xl text-zinc-500 ml-1 font-normal">m</span>
            </div>
            <div className="text-sm text-zinc-500">Total minutes practiced</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-card p-6 relative overflow-hidden group border-zinc-800 hover:border-red-500/50 transition-colors"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-zinc-400 group-hover:text-red-400 transition-colors">
              <Flame className="w-5 h-5" />
              <span className="font-medium text-sm uppercase tracking-wider">Daily Streak</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {currentStreak}<span className="text-xl text-zinc-500 ml-1 font-normal">days</span>
            </div>
            <div className="text-sm text-zinc-500">Consecutive practice days</div>
          </div>
        </motion.div>
      </div>

      {/* Progress Chart */}
      {sessions.length > 0 && (
        <div className="glass-card p-8 h-96 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-zinc-400" />
              Score History
            </h3>
          </div>
          <div className="flex-1 min-h-0 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#52525b" 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    borderColor: '#27272a', 
                    color: '#fafafa',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ffffff" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-5 h-5 text-zinc-400" />
            Recent Sessions
          </h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No sessions yet. Start practicing to see your history!
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sortedSessions.slice(0, visibleSessions).map((session) => {
              const safeScore = Number(session.score) || 0;
              const safeDuration = Number(session.duration) || 0;
              return (
              <Link 
                key={session.id} 
                to={`/feedback/${session.id}`}
                className="flex items-center justify-between p-6 hover:bg-zinc-900/50 transition-colors group border-l-2 border-transparent hover:border-indigo-500"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border
                    ${safeScore >= 80 ? 'border-green-500/20 text-green-400 bg-green-500/10' : 
                      safeScore >= 60 ? 'border-orange-500/20 text-orange-400 bg-orange-500/10' : 'border-red-500/20 text-red-400 bg-red-500/10'}`}
                  >
                    {safeScore}
                  </div>
                  <div>
                    <div className="font-medium text-lg text-zinc-200 group-hover:text-white transition-colors mb-0.5">
                      Practice Session
                    </div>
                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                      <span>{format(new Date(session.date), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-zinc-400">
                  <div className="flex items-center gap-2 text-sm bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800 text-zinc-300">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {safeDuration}s
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-sm font-medium">View Details</span>
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            )})}
            {visibleSessions < sortedSessions.length && (
              <div className="p-6 flex justify-center border-t border-white/5">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-medium"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
