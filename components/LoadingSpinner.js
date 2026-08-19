// components/LoadingSpinner.js
'use client';

import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClass = {
    small: '32px',
    medium: '48px',
    large: '64px',
  }[size] || '48px';

  return (
    <div className="spinner-container">
      <div className="spinner" style={{ width: sizeClass, height: sizeClass }}>
        <div className="spinner-inner"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}

      <style jsx>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
        }

        .spinner {
          position: relative;
          display: inline-block;
        }

        .spinner-inner {
          width: 100%;
          height: 100%;
          border: 3px solid var(--bg-tertiary);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spinner-message {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;