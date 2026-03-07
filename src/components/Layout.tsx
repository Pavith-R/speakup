import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Mic, BarChart2, User, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Layout() {
  const { user, logout } = useUser();
  const location = useLocation();

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-electric-blue-dark font-sans">
      <header className="border-b border-navy-800 bg-navy-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-electric-blue tracking-tight">
            <Mic className="w-6 h-6" />
            <span>SpeakUp</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-electric-blue ${location.pathname === '/dashboard' ? 'text-electric-blue' : 'text-electric-blue-dark'}`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link 
              to="/practice" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-electric-blue ${location.pathname.startsWith('/practice') ? 'text-electric-blue' : 'text-electric-blue-dark'}`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Practice</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-electric-blue-dark hover:text-red-400 transition-colors ml-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
