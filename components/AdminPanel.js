// components/AdminPanel.js
'use client';

import React, { useState } from 'react';
import CoursePlanEditor from './CoursePlanEditor';
import ApprovalQueue from './ApprovalQueue';
import FeedbackViewer from './FeedbackViewer';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('coursePlan');

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage course plans, approve learners, and view feedback</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'coursePlan' ? 'active' : ''}`}
          onClick={() => setActiveTab('coursePlan')}
        >
          📚 Course Plan
        </button>
        <button
          className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          ✓ Approvals
        </button>
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Feedback
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'coursePlan' && <CoursePlanEditor />}
        {activeTab === 'approvals' && <ApprovalQueue />}
        {activeTab === 'feedback' && <FeedbackViewer />}
      </div>

      <style jsx>{`
        .admin-panel-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .admin-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .admin-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid var(--border-color);
          flex-wrap: wrap;
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

        .admin-content {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .admin-header h1 {
            font-size: 1.5rem;
          }

          .admin-tabs {
            gap: 0;
          }

          .tab-btn {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
