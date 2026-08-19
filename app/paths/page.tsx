'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CreatePathForm from '@/components/CreatePathForm';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PathRow {
  path_id: string;
  role: 'admin' | 'moderator' | 'learner';
  status: string;
  learning_paths: {
    id: string;
    title: string;
    description: string | null;
    visibility: string;
  } | null;
}

const ROLE_BADGE: Record<string, string> = {
  admin: '🔑 Admin',
  moderator: '🛡 Mod',
  learner: '📚 Learner',
};

export default function MyPathsPage() {
  const [memberships, setMemberships] = useState<PathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth'); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('path_memberships')
        .select('path_id, role, status, learning_paths(id, title, description, visibility)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (!error) setMemberships((data ?? []) as PathRow[]);
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) return <LoadingSpinner message="Loading your paths…" />;

  const approved = memberships.filter((m) => m.status === 'approved');
  const pending  = memberships.filter((m) => m.status === 'pending');

  return (
    <div className="paths-page">
      <div className="paths-header">
        <h1>My Learning Paths</h1>
        <button className="button-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ New path'}
        </button>
      </div>

      {showCreate && (
        <div className="create-section">
          <CreatePathForm onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {approved.length === 0 && !showCreate && (
        <div className="empty-state">
          <p>You are not a member of any path yet.</p>
          <button className="button-primary" onClick={() => setShowCreate(true)}>
            Create your first path
          </button>
        </div>
      )}

      {approved.length > 0 && (
        <ul className="paths-list">
          {approved.map((m) => {
            const lp = m.learning_paths;
            if (!lp) return null;
            return (
              <li key={m.path_id} className="path-card" onClick={() => router.push(`/paths/${lp.id}`)}>
                <div className="path-card-header">
                  <span className="path-title">{lp.title}</span>
                  <span className="role-badge">{ROLE_BADGE[m.role] ?? m.role}</span>
                </div>
                {lp.description && <p className="path-desc">{lp.description}</p>}
                <span className={`visibility-tag ${lp.visibility}`}>{lp.visibility}</span>
              </li>
            );
          })}
        </ul>
      )}

      {pending.length > 0 && (
        <div className="pending-section">
          <h2>Pending requests</h2>
          <ul className="paths-list">
            {pending.map((m) => {
              const lp = m.learning_paths;
              if (!lp) return null;
              return (
                <li key={m.path_id} className="path-card pending">
                  <span className="path-title">{lp.title}</span>
                  <span className="role-badge">⏳ Pending</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style jsx>{`
        .paths-page { max-width: 860px; margin: 0 auto; padding: 2rem 1rem; }
        .paths-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .paths-header h1 { margin: 0; font-size: 1.75rem; font-weight: 800; }
        .create-section { margin-bottom: 2rem; }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .paths-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .path-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          cursor: pointer;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .path-card:hover { box-shadow: var(--shadow-md); border-color: var(--accent-primary); }
        .path-card.pending { cursor: default; opacity: 0.7; }
        .path-card.pending:hover { box-shadow: none; border-color: var(--border-color); }
        .path-card-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .path-title { font-weight: 700; font-size: 1.05rem; color: var(--text-primary); }
        .path-desc { margin: 0.5rem 0 0.75rem; font-size: 0.9rem; color: var(--text-secondary); }
        .role-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .visibility-tag {
          font-size: 0.75rem;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }
        .visibility-tag.public { background: #d1fae5; color: #065f46; }
        .visibility-tag.private { background: var(--bg-tertiary); color: var(--text-secondary); }
        .pending-section { margin-top: 2rem; }
        .pending-section h2 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
