import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Mic, BarChart2, LogOut, LayoutDashboard, Sparkles, Home, Settings } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Layout() {
  const { user, logout, isAuthReady } = useUser();
  const location = useLocation();

  if (!isAuthReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/practice', label: 'Practice', icon: Mic },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-zinc-400 bg-black selection:bg-white/20">
      {/* Desktop/Tablet Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <span>SpeakUp</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`
                    flex items-center gap-2 text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            <div className="w-px h-4 bg-white/10" />

            <button 
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          <Link 
            to="/dashboard"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              location.pathname === '/dashboard' ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <Link 
            to="/practice"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              location.pathname.startsWith('/practice') ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Mic className="w-6 h-6" />
            <span className="text-[10px] font-medium">Practice</span>
          </Link>

          <Link 
            to="/settings"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              location.pathname.startsWith('/settings') ? 'text-white' : 'text-zinc-500'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-24 pb-24 md:pt-32 md:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
