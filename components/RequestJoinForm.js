// components/RequestJoinForm.js
'use client';

import React, { useState } from 'react';
import { post } from '../lib/api';
import { validateName } from '../lib/utils';
import LoadingSpinner from './LoadingSpinner';

const RequestJoinForm = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateName(name)) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }

    setIsLoading(true);

    try {
      const formData = {
        name: name.trim(),
        joinCode: joinCode.trim() || null,
      };

      const response = await post('/learners/request', formData);

      setSuccess('Your request to join has been submitted! You will receive an email when approved.');
      setName('');
      setJoinCode('');

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit request. Please try again.';
      setError(errorMsg);
      console.error('Error requesting to join:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="request-form-container">
      <div className="request-form-card">
        <h2 className="form-title">Request to Join</h2>
        <p className="form-subtitle">
          Fill in your details to request access to the learning tracker
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isLoading && <LoadingSpinner />}

        {!isLoading && !success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="joinCode" className="form-label">
                Join Code <span className="optional">(optional)</span>
              </label>
              <input
                type="text"
                id="joinCode"
                name="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter join code if you have one"
                disabled={isLoading}
                className="form-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="button-primary">
              {isLoading ? 'Submitting...' : 'Request to Join'}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .request-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          padding: 1rem;
        }

        .request-form-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2rem;
          max-width: 450px;
          width: 100%;
          box-shadow: var(--shadow-md);
        }

        .form-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
        }

        .form-subtitle {
          margin: 0 0 1.5rem 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
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

        .optional {
          font-weight: 400;
          color: var(--text-tertiary);
          font-size: 0.85rem;
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

        .button-primary {
          width: 100%;
          padding: 0.75rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .button-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default RequestJoinForm;