import React from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Plus, BarChart2, Calendar, Clock } from 'lucide-react';

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}</h1>
          <p className="text-slate-400">Here's your progress so far.</p>
        </div>
        <Link 
          to="/practice" 
          className="px-6 py-3 rounded-lg bg-electric-blue hover:bg-electric-blue-dark text-navy-950 font-bold transition-colors flex items-center gap-2 shadow-lg shadow-electric-blue/20"
        >
          <Plus className="w-5 h-5" />
          New Session
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-white mb-1">{sessions.length}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Total Sessions</div>
        </div>
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-electric-blue mb-1">{averageScore}</div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Avg. Score</div>
        </div>
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-white mb-1">
            {totalDuration}m
          </div>
          <div className="text-sm text-slate-400 uppercase tracking-wider">Total Practice Time</div>
        </div>
      </div>

      {/* Progress Chart */}
      {sessions.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-xl p-6 h-80 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-electric-blue" />
            Score History
          </h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ffffff" 
                  strokeWidth={3} 
                  dot={{ fill: '#0f172a', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-navy-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-electric-blue" />
            Recent Sessions
          </h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No sessions yet. Start practicing to see your history!
          </div>
        ) : (
          <div className="divide-y divide-navy-800">
            {sortedSessions.map((session) => {
              const safeScore = Number(session.score) || 0;
              const safeDuration = Number(session.duration) || 0;
              return (
              <Link 
                key={session.id} 
                to={`/feedback/${session.id}`}
                className="flex items-center justify-between p-4 hover:bg-navy-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${safeScore >= 80 ? 'bg-green-500/10 text-green-400' : 
                      safeScore >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}
                  >
                    {safeScore}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200 group-hover:text-electric-blue transition-colors">
                      Practice Session
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <span>{format(new Date(session.date), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-slate-400">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4" />
                    {safeDuration}s
                  </div>
                  <div className="hidden sm:block text-electric-blue opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                    View Details →
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </motion.div>
  );
}
