'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import MultilingualLoader from '@/components/MultilingualLoader';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: 'email',
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace('/paths');
    }
  };

  return (
    <div className="auth-page">
      {/* Multilingual Loader full-overlay curtain displayed strictly on active operations */}
      {loading && (
        <div className="auth-loading">
          <MultilingualLoader 
            message={step === 'email' ? 'Sending your sign-in code...' : 'Verifying your sign-in code...'} 
            compact 
          />
        </div>
      )}

      <div className="auth-card">
        <h1>ODU Learner Companion</h1>
        <p className="auth-subtitle">Sign in with your email — no password needed.</p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              disabled={loading}
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Send sign-in code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <p className="auth-hint">Check <strong>{email}</strong> for a 6-digit code.</p>
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
              autoFocus
              disabled={loading}
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Verify & sign in'}
            </button>
            <button 
              type="button" 
              className="auth-back" 
              onClick={() => { setStep('email'); setError(''); setOtpCode(''); }}
              disabled={loading}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 76vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.25rem;
        }
        
        /* Backdrop blur cover context */
        .auth-loading { 
          position: fixed; 
          inset: 0; 
          z-index: 999; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: color-mix(in srgb, var(--bg-primary) 92%, transparent); 
          backdrop-filter: blur(4px); 
        }
        
        .auth-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 2.75rem;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-lg);
          border-top: 4px solid var(--accent-primary);
        }
        .auth-card h1 {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        .auth-subtitle {
          color: var(--text-secondary);
          margin: 0 0 2rem;
          font-size: 1rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .auth-form label {
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--text-primary);
        }
        .auth-hint {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .auth-error {
          color: var(--accent-danger);
          font-size: 0.875rem;
          margin: 0;
        }
        .auth-back {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0;
          text-align: left;
        }
        .auth-back:hover { color: var(--text-primary); }
        .auth-back:disabled { opacity: 0.5; cursor: not-allowed; }
        
        @media (max-width: 520px) { 
          .auth-page { padding: 2.5rem 1rem; }
          .auth-card { padding: 2rem 1.4rem; }
          .auth-card h1 { font-size: 1.7rem; } 
        }
      `}</style>
    </div>
  );
}
