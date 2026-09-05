'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CreatePathForm from '@/components/CreatePathForm';
import MultilingualLoader from '@/components/MultilingualLoader';

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
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth'); return; }

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

  if (loading) return <MultilingualLoader message="Preparing your learning paths" />;

  const approved = memberships.filter((m) => m.status === 'approved');
  const pending = memberships.filter((m) => m.status === 'pending');

  return (
    <div className="paths-page">
      <div className="paths-header">
        <div><p className="eyebrow">Compatibility view</p><h1>My Learning Spaces</h1><p>Pick up where you left off, or build a path for your community.</p><a className="journey-link" href="/journey">Open My Journey</a></div>
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
          <p className="empty-label">Your learning space is ready</p>
          <h2>Start with a path that matters to you.</h2>
          <p>Build a private path for your group, or explore a public Learning Path.</p>
          <button className="button-primary" onClick={() => setShowCreate(true)}>
            Create your first path
          </button>
        </div>
      )}

      {approved.length > 0 && (
        <section className="path-section" aria-labelledby="active-paths-heading">
          <div className="section-heading"><div><p className="section-kicker">In progress</p><h2 id="active-paths-heading">Active paths</h2></div><span>{approved.length} active</span></div>
          <ul className="paths-list">
          {approved.map((m) => {
            const lp = m.learning_paths;
            if (!lp) return null;
            return (
              <li key={m.path_id} className="path-card" onClick={() => router.push(`/paths/${lp.id}`)}>
                <div className="path-card-header">
                  <div><span className="path-title">{lp.title}</span><span className={`visibility-tag ${lp.visibility}`}>{lp.visibility} path</span></div>
                  <span className="role-badge">{ROLE_BADGE[m.role] ?? m.role}</span>
                </div>
                {lp.description && <p className="path-desc">{lp.description}</p>}
                <div className="path-card-footer">
                  <span className="continue-label">Open path</span>
                  {m.role === 'admin' && (
                    <button
                      className="button-secondary small"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/paths/${lp.id}/settings`);
                      }}
                    >
                      Edit path
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          </ul>
        </section>
      )}

      {pending.length > 0 && (
        <section className="pending-section" aria-labelledby="pending-paths-heading">
          <div className="section-heading"><div><p className="section-kicker">Awaiting review</p><h2 id="pending-paths-heading">Pending requests</h2></div><span>{pending.length} pending</span></div>
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
        </section>
      )}

      <style jsx>{`
        .paths-page { max-width: 960px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; }
        .paths-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2rem;
          padding-bottom: 2rem;
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .paths-header h1 { margin: 0; font-size: 2.25rem; font-weight: 800; }
        .paths-header p:not(.eyebrow) { color: var(--text-secondary); margin: .65rem 0 0; }
        .eyebrow,.section-kicker { margin: 0 0 .45rem; color: var(--accent-primary); font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .create-section { margin-bottom: 2rem; }
        .empty-state {
          padding: 3rem 0;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
          border-top: 3px solid var(--accent-secondary);
        }
        .empty-state h2 { color: var(--text-primary); font-size: 1.5rem; margin: 0; }.empty-state p { margin: 0; max-width: 530px; }.empty-label { color: var(--accent-primary); font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .path-section { margin-bottom: 2.75rem; }.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }.section-heading h2 { font-size: 1.25rem; margin: 0; }.section-heading > span { color: var(--text-secondary); font-size: .85rem; white-space: nowrap; }
        .paths-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .path-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.3rem 1.4rem;
          cursor: pointer;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .path-card:hover { box-shadow: var(--shadow-md); border-color: var(--accent-primary); transform: translateY(-1px); }
        .path-card.pending { cursor: default; opacity: 0.7; }
        .path-card.pending:hover { box-shadow: none; border-color: var(--border-color); }
        .path-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }.path-card-header > div { display: flex; align-items: center; flex-wrap: wrap; gap: .55rem; }
        .path-title { font-weight: 700; font-size: 1.08rem; color: var(--text-primary); }
        .path-desc { margin: 0.5rem 0 0.75rem; font-size: 0.9rem; color: var(--text-secondary); }
        .path-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: .85rem;
          border-top: 1px solid var(--border-color);
        }
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
          padding: 0.12rem 0.45rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }
        .button-secondary.small {
          padding: 0.4rem 0.7rem;
          font-size: 0.8rem;
        }
        .visibility-tag.public { background: #d1fae5; color: #065f46; }
        .visibility-tag.private { background: var(--bg-tertiary); color: var(--text-secondary); }
        .continue-label { font-size: .85rem; color: var(--accent-primary); font-weight: 700; }.pending-section { border-top: 1px solid var(--border-color); padding-top: 2rem; }.pending-section .path-card { background: transparent; }.pending-section h2 { font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-secondary); }
        @media (max-width: 640px) { .paths-page { padding: 2.5rem 1rem 4rem; }.paths-header { align-items: flex-start; flex-direction: column; gap: 1.25rem; }.paths-header h1 { font-size: 2rem; }.path-card-header { align-items: flex-start; }.path-card-footer { align-items: flex-end; }.section-heading { align-items: flex-start; } }
      `}</style>
    </div>
  );
}
