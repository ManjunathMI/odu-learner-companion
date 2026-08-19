// components/TrackerBoard.js
'use client';

import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import Phase from './Phase';
import Leaderboard from './Leaderboard';
import LoadingSpinner from './LoadingSpinner';

const TrackerBoard = ({ roomCode = '' }) => {
  const [phases, setPhases] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tracker');

  useEffect(() => {
    loadData();
  }, [roomCode]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch course plan
      const phasesResponse = await get(`/plans/${roomCode || 'default'}`);
      setPhases(phasesResponse.phases || phasesResponse);

      // Fetch leaderboard
      const leaderboardResponse = await get(`/leaderboard/${roomCode || 'default'}`);
      setLeaderboard(leaderboardResponse.entries || leaderboardResponse);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load tracker data');
      console.error('Error loading tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressChange = () => {
    // Reload leaderboard when progress changes
    loadLeaderboard();
  };

  const loadLeaderboard = async () => {
    try {
      const response = await get(`/leaderboard/${roomCode || 'default'}`);
      setLeaderboard(response.entries || response);
    } catch (error) {
      console.error('Error reloading leaderboard:', error);
    }
  };

  return (
    <div className="tracker-board-container">
      <div className="tracker-header">
        <h1 className="tracker-title">📚 Learning Tracker</h1>
        <button onClick={loadData} className="refresh-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <LoadingSpinner message="Loading your learning data..." />
      ) : (
        <>
          <div className="tracker-tabs">
            <button
              className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              Course Plan
            </button>
            <button
              className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Leaderboard
            </button>
          </div>

          {activeTab === 'tracker' && (
            <div className="tracker-content">
              {phases && phases.length > 0 ? (
                <div className="phases-list">
                  {phases.map((phase) => (
                    <Phase
                      key={phase.id}
                      phase={phase}
                      onProgressChange={handleProgressChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No course plan available yet. Check back soon!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="leaderboard-wrapper">
              <Leaderboard entries={leaderboard} />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .tracker-board-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .tracker-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .refresh-btn {
          padding: 0.75rem 1.5rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .refresh-btn:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: var(--shadow-md);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .tracker-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid var(--border-color);
        }

        .tab-btn {
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        .tracker-content {
          width: 100%;
        }

        .phases-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .leaderboard-wrapper {
          width: 100%;
        }

        .no-data {
          text-align: center;
          padding: 3rem 2rem;
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .no-data p {
          margin: 0;
          color: var(--text-tertiary);
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .tracker-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .tracker-title {
            font-size: 1.5rem;
          }

          .tracker-tabs {
            gap: 0;
          }

          .tab-btn {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackerBoard;
