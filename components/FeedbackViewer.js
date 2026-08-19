// components/FeedbackViewer.js
'use client';

import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDate, formatTime } from '../lib/utils';

const FeedbackViewer = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await get('/admin/feedback');
      setFeedbackList(response.feedback || response);
    } catch (error) {
      setError('Failed to load feedback');
      console.error('Error loading feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeedback = feedbackList.filter((item) => {
    if (filter === 'read') return item.read;
    if (filter === 'unread') return !item.read;
    return true;
  });

  const stats = {
    total: feedbackList.length,
    unread: feedbackList.filter((f) => !f.read).length,
    read: feedbackList.filter((f) => f.read).length,
  };

  return (
    <div className="feedback-viewer">
      <h2>Feedback</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="feedback-stats">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unread</span>
          <span className="stat-value unread-badge">{stats.unread}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Read</span>
          <span className="stat-value">{stats.read}</span>
        </div>
      </div>

      <div className="feedback-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({stats.unread})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read ({stats.read})
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading feedback..." />
      ) : (
        <>
          {filteredFeedback.length > 0 ? (
            <div className="feedback-list">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className={`feedback-item ${!item.read ? 'unread' : ''}`}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="feedback-header">
                    <div className="feedback-meta">
                      {!item.read && <span className="unread-indicator">●</span>}
                      <h3 className="feedback-author">{item.authorName || 'Anonymous'}</h3>
                      <span className="feedback-time">
                        {formatDate(new Date(item.createdAt))} at{' '}
                        {formatTime(new Date(item.createdAt))}
                      </span>
                    </div>
                    <button className="expand-btn" aria-expanded={expandedId === item.id}>
                      {expandedId === item.id ? '▼' : '▶'}
                    </button>
                  </div>

                  {expandedId === item.id && (
                    <div className="feedback-content">
                      <div className="feedback-text">
                        <p>{item.content}</p>
                      </div>
                      {item.email && (
                        <div className="feedback-contact">
                          <strong>Contact:</strong> {item.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-feedback">
              <p>No feedback to display</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .feedback-viewer {
          padding: 1.5rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .feedback-viewer h2 {
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

        .feedback-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 1rem;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-tertiary);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .unread-badge {
          color: var(--accent-danger);
        }

        .feedback-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          cursor: pointer;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .filter-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feedback-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .feedback-item:hover {
          box-shadow: var(--shadow-sm);
        }

        .feedback-item.unread {
          border-left: 4px solid var(--accent-primary);
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          user-select: none;
        }

        .feedback-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .unread-indicator {
          color: var(--accent-danger);
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .feedback-author {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 0;
        }

        .feedback-time {
          color: var(--text-tertiary);
          font-size: 0.85rem;
          white-space: nowrap;
          margin-left: 1rem;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: var(--text-secondary);
          padding: 0.5rem;
          flex-shrink: 0;
        }

        .expand-btn:hover {
          color: var(--accent-primary);
        }

        .feedback-content {
          border-top: 1px solid var(--border-color);
          padding: 1rem;
          background: var(--bg-primary);
        }

        .feedback-text {
          margin-bottom: 1rem;
        }

        .feedback-text p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .feedback-contact {
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: 4px;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .feedback-contact strong {
          color: var(--text-primary);
        }

        .no-feedback {
          text-align: center;
          padding: 3rem 2rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .no-feedback p {
          margin: 0;
          color: var(--text-tertiary);
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .feedback-stats {
            grid-template-columns: repeat(3, 1fr);
          }

          .feedback-time {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackViewer;
