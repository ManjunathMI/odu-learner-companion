// components/Phase.js
'use client';

import React, { useState } from 'react';
import Day from './Day';

const Phase = ({ phase, onProgressChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!phase || !phase.days) {
    return null;
  }

  const totalLessons = phase.days.reduce((sum, day) => sum + (day.lessons?.length || 0), 0);
  const completedLessons = phase.days.reduce(
    (sum, day) => sum + (day.lessons?.filter((l) => l.completed).length || 0),
    0
  );
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="phase-container">
      <div className="phase-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="phase-info">
          <h2 className="phase-title">{phase.title || phase.name}</h2>
          {phase.description && <p className="phase-description">{phase.description}</p>}
          <div className="phase-stats">
            <span className="stat">
              <strong>{completedLessons}</strong> completed
            </span>
            <span className="stat">
              <strong>{totalLessons}</strong> total lessons
            </span>
          </div>
        </div>

        <div className="phase-progress-section">
          <div className="large-progress-bar">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <span className="progress-percent">{progressPercentage}%</span>
        </div>

        <button className="expand-btn" aria-expanded={isExpanded}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="phase-content">
          {phase.days && phase.days.length > 0 ? (
            <div className="days-list">
              {phase.days.map((day) => (
                <Day key={day.id} day={day} onProgressChange={onProgressChange} />
              ))}
            </div>
          ) : (
            <p className="no-days">No days scheduled for this phase</p>
          )}
        </div>
      )}

      <style jsx>{`
        .phase-container {
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 2rem;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .phase-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
          border-bottom: 2px solid var(--border-color);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .phase-header:hover {
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
        }

        .phase-info {
          flex: 1;
          min-width: 0;
        }

        .phase-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .phase-description {
          margin: 0 0 1rem 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .phase-stats {
          display: flex;
          gap: 2rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat strong {
          color: var(--text-primary);
          font-size: 1.1rem;
        }

        .phase-progress-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 200px;
        }

        .large-progress-bar {
          flex: 1;
        }

        .progress-track {
          height: 12px;
          background: var(--bg-primary);
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid var(--border-color);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
          border-radius: 4px;
          transition: width 0.4s ease;
        }

        .progress-percent {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--accent-primary);
          min-width: 50px;
          text-align: right;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .expand-btn:hover {
          color: var(--accent-primary);
        }

        .phase-content {
          padding: 2rem;
          background: var(--bg-primary);
        }

        .days-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .no-days {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 1rem;
          padding: 3rem 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .phase-header {
            gap: 1rem;
            padding: 1.5rem;
          }

          .phase-stats {
            gap: 1.5rem;
          }

          .phase-progress-section {
            min-width: 150px;
          }
        }

        @media (max-width: 768px) {
          .phase-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem;
          }

          .phase-title {
            font-size: 1.5rem;
          }

          .phase-progress-section {
            width: 100%;
            min-width: auto;
          }

          .phase-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Phase;
