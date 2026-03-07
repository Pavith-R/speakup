import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  goals: string[];
  experienceLevel: string;
  weakness: string;
  isOnboarded: boolean;
}

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  score: number;
  transcript?: string;
  feedback: {
    clarity: number;
    pacing: number;
    wpm?: number;
    fillerWords: number;
    structure: number;
    tips: string[];
  };
}

interface UserContextType {
  user: UserProfile | null;
  sessions: Session[];
  login: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addSession: (session: Session) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('speakup_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('speakup_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('speakup_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('speakup_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('speakup_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const login = (email: string, name: string) => {
    setUser({
      name,
      email,
      goals: [],
      experienceLevel: '',
      weakness: '',
      isOnboarded: false,
    });
  };

  const logout = () => {
    setUser(null);
    setSessions([]);
    localStorage.removeItem('speakup_user');
    localStorage.removeItem('speakup_sessions');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const addSession = (session: Session) => {
    setSessions((prev) => [session, ...prev]);
  };

  return (
    <UserContext.Provider value={{ user, sessions, login, logout, updateProfile, addSession }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
