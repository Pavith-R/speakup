/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FreeSpeak from './pages/FreeSpeak';
import PracticeHub from './pages/PracticeHub';
import StructuredPractice from './pages/StructuredPractice';
import RandomTopic from './pages/practices/RandomTopic';
import Feedback from './pages/Feedback';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  if (user && !user.isOnboarded) {
    return <>{children}</>;
  }
  if (user && user.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="practice" element={
              <ProtectedRoute>
                <PracticeHub />
              </ProtectedRoute>
            } />
            
            <Route path="practice/free" element={
              <ProtectedRoute>
                <FreeSpeak />
              </ProtectedRoute>
            } />
            
            <Route path="practice/structured" element={
              <ProtectedRoute>
                <StructuredPractice />
              </ProtectedRoute>
            } />

            <Route path="practice/structured/random-topic" element={
              <ProtectedRoute>
                <RandomTopic />
              </ProtectedRoute>
            } />
            
            <Route path="feedback/:id" element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
