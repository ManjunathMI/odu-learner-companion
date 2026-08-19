// components/LessonItem.js
'use client';

import React, { useState } from 'react';
import { post, get, patch } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';

const LessonItem = ({ lesson, onProgressChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(lesson?.completed || false);
  const [notes, setNotes] = useState(lesson?.notes || '');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState('');

  const handleToggleProgress = async () => {
    setIsLoadingProgress(true);
    setError('');

    try {
      const response = await post('/progress', {
        itemId: lesson.id,
        completed: !isCompleted,
      });

      setIsCompleted(!isCompleted);

      if (onProgressChange) {
        onProgressChange({
          itemId: lesson.id,
          completed: !isCompleted,
        });
      }
    } catch (error) {
      setError('Failed to update progress');
      console.error('Error updating progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsLoadingNotes(true);
    setError('');

    try {
      const response = await patch(`/notes/${lesson.id}`, {
        content: notes,
      });

      setNotes(response.content);
    } catch (error) {
      setError('Failed to save notes');
      console.error('Error saving notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  return (
    <div className="lesson-item">
      <div className="lesson-header">
        <div className="lesson-checkbox">
          <input
            type="checkbox"
            id={`lesson-${lesson.id}`}
            checked={isCompleted}
            onChange={handleToggleProgress}
            disabled={isLoadingProgress}
            className="checkbox-input"
          />
          <label htmlFor={`lesson-${lesson.id}`} className="checkbox-label">
            {lesson.title}
          </label>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-btn"
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="lesson-content">
          {lesson.description && (
            <div className="lesson-description">
              <p>{lesson.description}</p>
            </div>
          )}

          <div className="notes-section">
            <h4>Notes</h4>
            {error && <div className="alert alert-danger">{error}</div>}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              disabled={isLoadingNotes}
              className="notes-input"
            />

            <button
              onClick={handleSaveNotes}
              disabled={isLoadingNotes}
              className="button-primary"
            >
              {isLoadingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .lesson-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .lesson-item:hover {
          box-shadow: var(--shadow-sm);
        }

        .lesson-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          user-select: none;
        }

        .lesson-header:hover {
          background: var(--bg-secondary);
        }

        .lesson-checkbox {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--accent-secondary);
        }

        .checkbox-label {
          cursor: pointer;
          font-weight: 500;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .checkbox-input:checked + .checkbox-label {
          text-decoration: line-through;
          color: var(--text-tertiary);
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          padding: 0.5rem;
        }

        .expand-btn:hover {
          color: var(--accent-primary);
        }

        .lesson-content {
          border-top: 1px solid var(--border-color);
          padding: 1rem;
          background: var(--bg-secondary);
        }

        .lesson-description {
          margin-bottom: 1.5rem;
        }

        .lesson-description p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .notes-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notes-section h4 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .notes-input {
          width: 100%;
          min-height: 120px;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
        }

        .notes-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .button-primary {
          padding: 0.5rem 1rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .button-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>
  );
};

export default LessonItem;
