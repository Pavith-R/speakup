import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PracticeHub from './pages/PracticeHub';
import FreeSpeak from './pages/FreeSpeak';
import StructuredPractice from './pages/StructuredPractice';
import RandomTopic from './pages/practices/RandomTopic';
import InterviewSimulator from './pages/practices/InterviewSimulator';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/practice" element={<PracticeHub />} />
              <Route path="/practice/free" element={<FreeSpeak />} />
              <Route path="/practice/structured" element={<StructuredPractice />} />
              <Route path="/practice/structured/random-topic" element={<RandomTopic />} />
              <Route path="/practice/structured/interview" element={<InterviewSimulator />} />
              <Route path="/feedback/:id" element={<Feedback />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
