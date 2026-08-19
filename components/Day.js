// components/Day.js
'use client';

import React, { useState } from 'react';
import LessonItem from './LessonItem';

const Day = ({ day, onProgressChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!day || !day.lessons) {
    return null;
  }

  const completedLessons = day.lessons.filter((l) => l.completed).length;
  const totalLessons = day.lessons.length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="day-container">
      <div className="day-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="day-title-section">
          <h3 className="day-title">{day.title || day.name}</h3>
          <span className="day-progress">
            {completedLessons}/{totalLessons} lessons
          </span>
        </div>

        <div className="day-progress-bar">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-percent">{progressPercentage}%</span>
        </div>

        <button className="expand-btn" aria-expanded={isExpanded}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="day-content">
          {day.lessons && day.lessons.length > 0 ? (
            <div className="lessons-list">
              {day.lessons.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  onProgressChange={onProgressChange}
                />
              ))}
            </div>
          ) : (
            <p className="no-lessons">No lessons for this day</p>
          )}
        </div>
      )}

      <style jsx>{`
        .day-container {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 1.5rem;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }

        .day-header:hover {
          background: var(--bg-tertiary);
        }

        .day-title-section {
          flex: 1;
          min-width: 0;
        }

        .day-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .day-progress {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .day-progress-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 250px;
        }

        .progress-track {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-secondary), var(--accent-primary));
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-percent {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 40px;
          text-align: right;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .expand-btn:hover {
          color: var(--accent-primary);
        }

        .day-content {
          padding: 1.5rem;
        }

        .lessons-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .no-lessons {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.95rem;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .day-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .day-progress-bar {
            width: 100%;
            min-width: auto;
          }

          .progress-track {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Day;
