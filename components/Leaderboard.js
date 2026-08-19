// components/Leaderboard.js
'use client';

import React from 'react';
import { calculateProgress } from '../lib/utils';

const Leaderboard = ({ entries = [] }) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-card">
          <h2 className="leaderboard-title">🏆 Leaderboard</h2>
          <p className="no-entries">No learners yet</p>
        </div>
      </div>
    );
  }

  // Sort by progress (highest first), then by name
  const sortedEntries = [...entries].sort((a, b) => {
    const progressA = calculateProgress(a.completedLessons, a.totalLessons);
    const progressB = calculateProgress(b.completedLessons, b.totalLessons);

    if (progressB !== progressA) {
      return progressB - progressA;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <h2 className="leaderboard-title">🏆 Leaderboard</h2>

        <div className="leaderboard-list">
          {sortedEntries.map((entry, index) => {
            const progress = calculateProgress(entry.completedLessons, entry.totalLessons);
            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            return (
              <div key={entry.userId} className="leaderboard-entry">
                <div className="entry-rank">
                  {medalEmoji ? (
                    <span className="medal">{medalEmoji}</span>
                  ) : (
                    <span className="rank-number">#{index + 1}</span>
                  )}
                </div>

                <div className="entry-info">
                  <h3 className="entry-name">{entry.name}</h3>
                  <p className="entry-stats">
                    {entry.completedLessons} / {entry.totalLessons} lessons
                  </p>
                </div>

                <div className="entry-progress">
                  <div className="progress-bar">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="progress-text">{progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .leaderboard-container {
          width: 100%;
        }

        .leaderboard-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2rem;
          box-shadow: var(--shadow-md);
        }

        .leaderboard-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .no-entries {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.95rem;
          padding: 2rem;
          margin: 0;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .leaderboard-entry:hover {
          background: var(--bg-tertiary);
          box-shadow: var(--shadow-sm);
        }

        .entry-rank {
          flex-shrink: 0;
          width: 50px;
          text-align: center;
        }

        .medal {
          font-size: 1.5rem;
          display: block;
        }

        .rank-number {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .entry-info {
          flex: 0 0 200px;
        }

        .entry-name {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .entry-stats {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-tertiary);
        }

        .entry-progress {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 200px;
        }

        .progress-bar {
          flex: 1;
        }

        .progress-track {
          height: 8px;
          background: var(--bg-primary);
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

        .progress-text {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          min-width: 40px;
          text-align: right;
        }

        @media (max-width: 768px) {
          .leaderboard-card {
            padding: 1rem;
          }

          .leaderboard-entry {
            gap: 1rem;
            padding: 0.75rem;
          }

          .entry-info {
            flex: 0 0 150px;
          }

          .entry-progress {
            min-width: 150px;
          }

          .leaderboard-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
