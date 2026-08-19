// components/ApprovalQueue.js
'use client';

import React, { useEffect, useState } from 'react';
import { get, patch } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDate } from '../lib/utils';

const ApprovalQueue = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionInProgress, setActionInProgress] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await get('/admin/approvals');
      setRequests(response.requests || response);
    } catch (error) {
      setError('Failed to load approval requests');
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionInProgress({ ...actionInProgress, [userId]: 'approving' });
    setError('');

    try {
      await patch(`/admin/approvals/${userId}`, { status: 'approved' });
      setRequests(requests.filter((r) => r.userId !== userId));
      setSuccess('Learner approved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to approve learner');
      console.error('Error approving:', error);
    } finally {
      setActionInProgress({ ...actionInProgress, [userId]: null });
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;

    setActionInProgress({ ...actionInProgress, [userId]: 'rejecting' });
    setError('');

    try {
      await patch(`/admin/approvals/${userId}`, { status: 'rejected' });
      setRequests(requests.filter((r) => r.userId !== userId));
      setSuccess('Request rejected');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to reject request');
      console.error('Error rejecting:', error);
    } finally {
      setActionInProgress({ ...actionInProgress, [userId]: null });
    }
  };

  return (
    <div className="approval-queue">
      <h2>Approval Queue</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isLoading ? (
        <LoadingSpinner message="Loading approval requests..." />
      ) : (
        <>
          {requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request.userId} className="request-card">
                  <div className="request-info">
                    <h3>{request.name}</h3>
                    <p className="request-email">{request.email}</p>
                    {request.joinCode && (
                      <p className="join-code">Join Code: {request.joinCode}</p>
                    )}
                    <p className="request-date">
                      Requested: {formatDate(new Date(request.createdAt))}
                    </p>
                  </div>

                  <div className="request-actions">
                    <button
                      onClick={() => handleApprove(request.userId)}
                      disabled={actionInProgress[request.userId]}
                      className="button-success"
                    >
                      {actionInProgress[request.userId] === 'approving'
                        ? 'Approving...'
                        : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(request.userId)}
                      disabled={actionInProgress[request.userId]}
                      className="button-danger"
                    >
                      {actionInProgress[request.userId] === 'rejecting'
                        ? 'Rejecting...'
                        : '✕ Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-requests">
              <p>No pending approval requests</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .approval-queue {
          padding: 1.5rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .approval-queue h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
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

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .request-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 1.5rem;
        }

        .request-info {
          flex: 1;
        }

        .request-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .request-email {
          margin: 0 0 0.5rem 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .join-code {
          margin: 0.5rem 0;
          padding: 0.5rem 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
          color: var(--accent-primary);
          font-weight: 600;
        }

        .request-date {
          margin: 0.5rem 0 0 0;
          color: var(--text-tertiary);
          font-size: 0.85rem;
        }

        .request-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
          min-width: 200px;
        }

        .button-success,
        .button-danger {
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .button-success {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .button-success:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.2);
        }

        .button-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .button-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }

        .button-success:disabled,
        .button-danger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .no-requests {
          text-align: center;
          padding: 3rem 2rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .no-requests p {
          margin: 0;
          color: var(--text-tertiary);
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .request-card {
            flex-direction: column;
          }

          .request-actions {
            width: 100%;
            justify-content: stretch;
          }

          .button-success,
          .button-danger {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ApprovalQueue;
