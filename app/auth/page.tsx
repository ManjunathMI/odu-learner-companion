'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

// Two-step OTP flow: enter email → enter 6-digit code.
// Magic link email is also sent; user can click it instead of entering the code.
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
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="button-primary" disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Verify & sign in'}
            </button>
            <button type="button" className="auth-back" onClick={() => { setStep('email'); setError(''); setOtpCode(''); }}>
              ← Use a different email
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .auth-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-lg);
        }
        .auth-card h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }
        .auth-subtitle {
          color: var(--text-secondary);
          margin: 0 0 2rem;
          font-size: 0.95rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .auth-form label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
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
      `}</style>
    </div>
  );
}
