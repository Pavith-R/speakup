import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface User {
  uid: string;
  name: string;
  email: string;
  isOnboarded: boolean;
  goals: string[];
  experienceLevel: string;
  weakness: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Session {
  id: string;
  userId: string;
  date: any;
  duration: number;
  score: number;
  transcript: string;
  feedback: any;
  audioData?: string;
  audioUrl?: string; // For backward compatibility in UI
}

interface UserContextType {
  user: User | null;
  sessions: Session[];
  isAuthReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  addSession: (session: Omit<Session, 'userId' | 'date'>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUser(userSnap.data() as User);
          } else {
            // Create new user profile
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              isOnboarded: false,
              goals: [],
              experienceLevel: '',
              weakness: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setSessions([]);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const q = query(sessionsRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions: Session[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedSessions.push({
          ...data,
          id: doc.id,
          // Convert legacy base64 to data URL if audioUrl is missing
          audioUrl: data.audioUrl || (data.audioData ? `data:audio/webm;base64,${data.audioData}` : undefined)
        } as Session);
      });
      setSessions(loadedSessions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/sessions`);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (
        error.code !== 'auth/popup-closed-by-user' && 
        error.code !== 'auth/user-cancelled' && 
        error.code !== 'auth/cancelled-popup-request'
      ) {
        console.error("Login failed:", error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateProfile = async (profile: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...profile, updatedAt: serverTimestamp() };
    
    // Optimistic update
    setUser(updatedUser as User);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = { ...profile, updatedAt: serverTimestamp() };
      await updateDoc(userRef, updateData);
    } catch (error) {
      // Revert on failure
      setUser(user);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addSession = async (sessionData: Omit<Session, 'userId' | 'date'>) => {
    if (!user) return;

    let audioUrl = sessionData.audioUrl;

    if (sessionData.audioData) {
      try {
        const audioRef = ref(storage, `users/${user.uid}/sessions/${sessionData.id}/audio.webm`);
        // Upload base64 string
        await uploadString(audioRef, sessionData.audioData, 'base64', {
          contentType: 'audio/webm'
        });
        audioUrl = await getDownloadURL(audioRef);
      } catch (error) {
        console.error("Error uploading audio to Storage:", error);
        // Continue without audio URL if upload fails
      }
    }

    const newSession = {
      ...sessionData,
      audioUrl,
      userId: user.uid,
      date: serverTimestamp()
    };
    
    // Remove audioData completely from the object to save Firestore space
    delete newSession.audioData;

    try {
      const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionData.id);
      await setDoc(sessionRef, newSession);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/sessions/${sessionData.id}`);
    }
  };

  return (
    <UserContext.Provider value={{ user, sessions, isAuthReady, login, logout, updateProfile, addSession }}>
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
