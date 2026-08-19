// components/CoursePlanEditor.js
'use client';

import React, { useEffect, useState } from 'react';
import { get, post, put, del, patch } from '../lib/api';
import LoadingSpinner from './LoadingSpinner';

const CoursePlanEditor = () => {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newPhase, setNewPhase] = useState({ title: '', description: '' });
  const [expandedPhase, setExpandedPhase] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await get('/admin/plans');
      setPhases(response.phases || response);
    } catch (error) {
      setError('Failed to load course plans');
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();
    if (!newPhase.title.trim()) {
      setError('Phase title is required');
      return;
    }

    try {
      const response = await post('/admin/plans', newPhase);
      setPhases([...phases, response]);
      setNewPhase({ title: '', description: '' });
      setSuccess('Phase added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add phase');
    }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!window.confirm('Are you sure you want to delete this phase?')) return;

    try {
      await del(`/admin/plans/${phaseId}`);
      setPhases(phases.filter((p) => p.id !== phaseId));
      setSuccess('Phase deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to delete phase');
    }
  };

  return (
    <div className="course-plan-editor">
      <h2>Course Plan Editor</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isLoading ? (
        <LoadingSpinner message="Loading course plans..." />
      ) : (
        <>
          <form onSubmit={handleAddPhase} className="add-phase-form">
            <div className="form-group">
              <label htmlFor="phaseTitle">New Phase Title</label>
              <input
                type="text"
                id="phaseTitle"
                value={newPhase.title}
                onChange={(e) => setNewPhase({ ...newPhase, title: e.target.value })}
                placeholder="e.g., Phase 1: Introduction"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phaseDesc">Description</label>
              <textarea
                id="phaseDesc"
                value={newPhase.description}
                onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" className="button-primary">
              Add Phase
            </button>
          </form>

          <div className="phases-list">
            {phases.length > 0 ? (
              phases.map((phase) => (
                <div key={phase.id} className="phase-item">
                  <div className="phase-header">
                    <h3>{phase.title}</h3>
                    <div className="phase-actions">
                      <button
                        onClick={() =>
                          setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
                        }
                        className="expand-btn"
                      >
                        {expandedPhase === phase.id ? '▼' : '▶'}
                      </button>
                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {phase.description && (
                    <p className="phase-desc">{phase.description}</p>
                  )}
                  {expandedPhase === phase.id && (
                    <div className="phase-days">
                      <p className="info-text">Days ({phase.days?.length || 0})</p>
                      {phase.days && phase.days.length > 0 ? (
                        <ul>
                          {phase.days.map((day) => (
                            <li key={day.id}>
                              {day.title} - {day.lessons?.length || 0} lessons
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-data">No days yet</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-data">No phases yet. Create one to get started!</p>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .course-plan-editor {
          padding: 1.5rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .course-plan-editor h2 {
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

        .add-phase-form {
          background: var(--bg-secondary);
          padding: 1.5rem;
          border-radius: 6px;
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .button-primary {
          padding: 0.75rem 1.5rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .button-primary:hover {
          opacity: 0.9;
        }

        .phases-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .phase-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 1rem;
        }

        .phase-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .phase-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .phase-actions {
          display: flex;
          gap: 0.5rem;
        }

        .expand-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
        }

        .button-danger {
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .button-danger:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .phase-desc {
          margin: 0.5rem 0 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .phase-days {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .info-text {
          margin: 0 0 0.5rem 0;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .phase-days ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .phase-days li {
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .no-data {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.9rem;
          padding: 2rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default CoursePlanEditor;
