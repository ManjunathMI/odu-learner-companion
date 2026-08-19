// components/LoginForm.js
'use client';

import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, verifyOtp } from '../lib/auth';
import { validateEmail } from '../lib/utils';
import LoadingSpinner from './LoadingSpinner';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup' or 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithEmail(email);

      if (result.success) {
        setSuccess('Check your email for the magic link to sign in!');
        setEmail('');
        setShowOtp(true);
      } else {
        setError(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the complete OTP code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtp(email, otpCode);

      if (result.success) {
        setSuccess('Successfully signed in! Redirecting...');
        setOtpCode('');
        // Redirect will be handled by parent or useEffect in page
      } else {
        setError(result.error || 'Invalid OTP code');
      }
    } catch (error) {
      setError('Failed to verify OTP');
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <h2 className="form-title">Welcome Back</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!showOtp ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
                required
                className="form-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="button-primary">
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <div className="form-footer">
              <p>
                We'll send you a magic link to sign in securely. No password needed!
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                Enter OTP Code
              </label>
              <p className="form-hint">Check your email for the 6-digit code</p>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={isLoading}
                required
                className="form-input otp-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="button-primary">
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setOtpCode('');
                setEmail('');
              }}
              className="button-secondary"
              disabled={isLoading}
            >
              Back
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .login-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .login-form-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          box-shadow: var(--shadow-md);
        }

        .form-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .otp-input {
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          text-align: center;
          font-weight: 700;
          font-family: monospace;
        }

        .form-hint {
          margin: 0.5rem 0 0.75rem 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .button-primary,
        .button-secondary {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .button-primary {
          background: var(--accent-primary);
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .button-secondary:hover:not(:disabled) {
          background: var(--bg-secondary);
          border-color: var(--text-secondary);
        }

        .button-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
          text-align: center;
        }

        .form-footer p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;