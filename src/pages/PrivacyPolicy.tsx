import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none text-zinc-300 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, update your profile, or use our services. This includes your name, email address, and audio recordings of your practice sessions.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services. Specifically, we use your audio recordings to generate transcripts and provide AI-powered feedback on your speaking skills.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Data Storage and Security</h2>
          <p>Your data, including audio recordings and transcripts, is securely stored using Firebase. We implement reasonable security measures to protect your personal information from unauthorized access or disclosure.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Third-Party Services</h2>
          <p>We use Google's Gemini API to analyze your speech and provide feedback. By using our service, you acknowledge that your audio data and transcripts will be processed by these third-party services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time through your account settings. You can also contact us to request the deletion of your account and associated data.</p>
        </section>
      </div>
    </div>
  );
}
