import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert max-w-none text-zinc-300 space-y-6">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using our services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
          <p>We provide an AI-powered platform for practicing and improving public speaking skills. This includes audio recording, transcription, and automated feedback generation.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Accounts</h2>
          <p>You must create an account to use certain features of our service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. User Content</h2>
          <p>You retain all rights to the audio recordings and other content you submit to the service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and process your content solely for the purpose of providing the service to you.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Acceptable Use</h2>
          <p>You agree not to use the service for any unlawful purpose or in any way that violates these Terms. You must not submit any content that is offensive, harmful, or infringes on the rights of others.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Limitation of Liability</h2>
          <p>In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.</p>
        </section>
      </div>
    </div>
  );
}
