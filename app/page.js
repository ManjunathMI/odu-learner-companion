// app/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase, onAuthStateChange } from '../lib/auth';
import { get, post } from '../lib/api';
import LoginForm from '../components/LoginForm';
import RequestJoinForm from '../components/RequestJoinForm';
import LoadingSpinner from '../components/LoadingSpinner';

const Welcome = () => {
  const [user, setUser] = useState(null);
  const [learnerStatus, setLearnerStatus] = useState(null); // 'approved', 'pending', null
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkUser();
    const { data: subscription } = onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkLearnerStatus(session.user.id);
      } else {
        setUser(null);
        setLearnerStatus(null);
      }
    });
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        checkLearnerStatus(currentUser.id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setIsLoading(false);
    }
  };

  const checkLearnerStatus = async (userId) => {
    try {
      const response = await get('/learners/status');
      if (response.status === 'approved') {
        setLearnerStatus('approved');
        setTimeout(() => router.push('/tracker'), 500);
      } else if (response.status === 'pending') {
        setLearnerStatus('pending');
      } else {
        setLearnerStatus(null);
      }
    } catch (error) {
      console.error('Error checking learner status:', error);
      setLearnerStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSubmitting(true);
    setError('');
    try {
      await post('/feedback', { content: feedback });
      setFeedback('');
      setFeedbackSuccess('Thank you for your feedback!');
      setTimeout(() => setFeedbackSuccess(''), 3000);
    } catch (error) {
      setError('Failed to submit feedback');
      console.error('Error submitting feedback:', error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (learnerStatus === 'approved') {
    return (
      <div className="welcome-container">
        <div className="redirect-message">
          <LoadingSpinner message="Redirecting to tracker..." />
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        {!user ? (
          <div className="auth-section">
            <div className="section-header">
              <h1>Welcome to ODU Learner Companion</h1>
              <p>Your personal learning journey tracker</p>
            </div>
            <LoginForm />
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        ) : learnerStatus === 'pending' ? (
          <div className="pending-section">
            <div className="pending-card">
              <h2>⏳ Waiting for Approval</h2>
              <p>
                Thank you for requesting access! We'll notify you via email once approved.
              </p>
              <div className="pending-actions">
                <button
                  onClick={async () => {
                    const result = await supabase.auth.signOut();
                    if (!result.error) {
                      setUser(null);
                      setLearnerStatus(null);
                    }
                  }}
                  className="button-secondary"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="join-section">
            <div className="section-header">
              <h1>One More Step</h1>
              <p>Complete your profile to request access</p>
            </div>
            <RequestJoinForm
              onSuccess={() => {
                setLearnerStatus('pending');
              }}
            />
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        )}
        {user && (
          <div className="feedback-section">
            <h2>Share Your Feedback</h2>
            <p>Help us improve by sharing your thoughts</p>
            {feedbackSuccess && <div className="alert alert-success">{feedbackSuccess}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your feedback here..."
                disabled={feedbackSubmitting}
                className="feedback-textarea"
              />
              <button type="submit" disabled={feedbackSubmitting} className="button-primary">
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}
      </div>
      <style jsx>{`
        .welcome-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
        .welcome-content { display: flex; flex-direction: column; gap: 3rem; }
        .section-header { text-align: center; margin-bottom: 2rem; }
        .section-header h1 { margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 800; color: var(--text-primary); }
        .section-header p { margin: 0; color: var(--text-secondary); font-size: 1rem; }
        .pending-card { background: var(--bg-primary); border: 2px solid var(--accent-secondary); border-radius: 8px; padding: 2rem; text-align: center; box-shadow: var(--shadow-md); }
        .pending-card h2 { margin: 0 0 1rem 0; font-size: 1.5rem; color: var(--text-primary); }
        .pending-card p { margin: 0 0 1.5rem 0; color: var(--text-secondary); line-height: 1.6; }
        .pending-actions { display: flex; justify-content: center; gap: 1rem; }
        .button-secondary { padding: 0.75rem 1.5rem; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; }
        .button-secondary:hover { background: var(--bg-tertiary); border-color: var(--text-secondary); }
        .alert { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.95rem; }
        .alert-danger { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
        .alert-success { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); }
        .feedback-section { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; }
        .feedback-section h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text-primary); }
        .feedback-section p { margin: 0 0 1.5rem 0; color: var(--text-secondary); }
        .feedback-form { display: flex; flex-direction: column; gap: 1rem; }
        .feedback-textarea { width: 100%; min-height: 120px; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary); font-family: inherit; font-size: 0.95rem; resize: vertical; }
        .feedback-textarea:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .button-primary { padding: 0.75rem; background: var(--accent-primary); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .button-primary:hover:not(:disabled) { opacity: 0.9; }
        .button-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .redirect-message { text-align: center; padding: 3rem 1rem; }
        @media (max-width: 768px) { .welcome-container { padding: 1rem; } .section-header h1 { font-size: 1.5rem; } }
      `}</style>
    </div>
  );
};

export default Welcome;
