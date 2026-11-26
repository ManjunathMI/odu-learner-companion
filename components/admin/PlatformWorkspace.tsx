'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';

interface PendingPath {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  created_by: string;
  created_at: string;
  visibility: 'public' | 'private';
  wall_status: 'pending_review' | 'approved' | 'rejected' | 'unlisted';
}

interface QuotaRequest {
  id: string;
  user_id: string;
  current_limit: number;
  requested_limit: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  requester: { display_name: string; avatar_url: string | null } | null;
}

export default function PlatformWorkspace({ section }: { section: 'publication' | 'paths' | 'quotas' }) {
  const [paths, setPaths] = useState<PendingPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pathsError, setPathsError] = useState('');
  const [quotaError, setQuotaError] = useState('');
  const [quotaRequests, setQuotaRequests] = useState<QuotaRequest[]>([]);
  const reviewPaths = paths.filter((path) => path.visibility === 'public' && path.wall_status === 'pending_review');

  useEffect(() => {
    let active = true;
    void Promise.allSettled([section !== 'quotas' ? apiFetch<PendingPath[]>('/admin/paths', {signal: AbortSignal.timeout(20000)}) : Promise.resolve([]), section === 'quotas' ? apiFetch<QuotaRequest[]>('/admin/quota-requests', {signal: AbortSignal.timeout(20000)}) : Promise.resolve([])]).then(([pathResult, quotaResult]) => {
      if (!active) return;
      if (pathResult.status === 'fulfilled') setPaths(pathResult.value);
      else setPathsError(pathResult.reason instanceof Error ? pathResult.reason.message : 'Unable to load publication data');
      if (quotaResult.status === 'fulfilled') setQuotaRequests(quotaResult.value);
      else setQuotaError(quotaResult.reason instanceof Error ? quotaResult.reason.message : 'Unable to load quota data');
      setLoading(false);
    });
    return () => { active = false; };
  }, [section]);

  const decide = async (pathId: string, decision: 'approved' | 'rejected' | 'unlisted') => {
    setProcessingId(pathId);
    try {
      await apiFetch(`/admin/paths/${pathId}`, { method: 'POST', body: { decision } });
      setPaths((current) => current.map((path) => path.id === pathId ? { ...path, wall_status: decision } : path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update path');
    } finally {
      setProcessingId(null);
    }
  };

  const decideQuota = async (requestId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(requestId);
    try {
      await apiFetch(`/admin/quota-requests/${requestId}`, { method: 'POST', body: { decision } });
      setQuotaRequests((current) => current.map((request) => request.id === requestId ? { ...request, status: decision } : request));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review quota request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <MultilingualLoader message="Preparing the platform workspace" />;

  return (
    <div className="admin-page">
      {error && <p className="error" role="alert">{error}</p>}
      {pathsError && <p className="error" role="alert">Publication data: {pathsError}</p>}
      {quotaError && <p className="error" role="alert">Quota data: {quotaError}</p>}
      {(pathsError || quotaError) && <button className="button-secondary" type="button" onClick={() => window.location.reload()}>Retry loading</button>}

      {section === 'quotas' && quotaRequests.some((request) => request.status === 'pending') && <section className="workspace-section" aria-labelledby="quota-heading"><div className="section-heading"><div><p className="section-kicker">Creator capacity</p><h2 id="quota-heading">Pending quota requests</h2></div><span>{quotaRequests.filter((request) => request.status === 'pending').length} waiting</span></div><div className="path-list">
        {quotaRequests.filter((request) => request.status === 'pending').map((request) => <article key={request.id} className="path-card"><div className="path-title-row"><div><h2>{request.requester?.display_name || request.user_id}</h2><p className="meta">Requested {new Date(request.created_at).toLocaleDateString()} · {request.current_limit} to {request.requested_limit} paths</p></div><span className="status-badge">pending</span></div>{request.reason && <p className="description">{request.reason}</p>}<div className="actions"><button className="button-primary" type="button" disabled={processingId === request.id} onClick={() => decideQuota(request.id, 'approved')}>{processingId === request.id ? 'Processing…' : 'Approve'}</button><button className="button-secondary" type="button" disabled={processingId === request.id} onClick={() => decideQuota(request.id, 'rejected')}>Reject</button></div></article>)}
      </div></section>}

      {section === 'paths' && !paths.length && !pathsError && <p>No learning paths have been created yet.</p>}
      {section === 'publication' && !reviewPaths.length && !pathsError && <p>No paths are waiting for review.</p>}
      {section === 'quotas' && !quotaRequests.some(request => request.status === 'pending') && !quotaError && <p>No quota requests are waiting for review.</p>}

      {section === 'publication' && reviewPaths.length > 0 && <section className="workspace-section" aria-labelledby="review-heading"><div className="section-heading"><div><p className="section-kicker">Publication queue</p><h2 id="review-heading">Needs review</h2></div><span>{reviewPaths.length} waiting</span></div><div className="path-list">
        {reviewPaths.map((path) => (
          <article key={path.id} className="path-card">
            <div className="path-title-row">
              <div>
                <h2>{path.title}</h2>
                <p className="meta">{path.visibility} · {new Date(path.created_at).toLocaleDateString()}</p>
              </div>
              <span className="status-badge">{path.wall_status}</span>
            </div>

            {path.description && <p className="description">{path.description}</p>}
            {path.tags?.length ? <p className="tags">{path.tags.join(' · ')}</p> : null}

            <div className="actions">
              <button
                className="button-primary"
                type="button"
                disabled={processingId === path.id}
                onClick={() => decide(path.id, 'approved')}
              >
                {processingId === path.id ? 'Processing…' : 'Approve'}
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={processingId === path.id}
                onClick={() => decide(path.id, 'rejected')}
              >
                Reject
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={processingId === path.id}
                onClick={() => decide(path.id, 'unlisted')}
              >
                Unlist
              </button>
              <Link className="button-secondary" href={`/paths/${path.id}/settings`}>Manage path</Link>
            </div>
          </article>
        ))}
      </div></section>}

      {section === 'paths' && paths.length > 0 && <section className="workspace-section" aria-labelledby="all-paths-heading"><div className="section-heading"><div><p className="section-kicker">All paths</p><h2 id="all-paths-heading">Platform directory</h2></div><span>{paths.length} total</span></div><div className="directory-list">
        {paths.map((path) => <article key={path.id} className="directory-row"><div><strong>{path.title}</strong><span>{path.visibility} path · {path.wall_status.replace('_', ' ')}</span></div><Link className="button-secondary" href={`/paths/${path.id}/settings`}>Manage</Link></article>)}
      </div></section>}

      <style jsx>{`
        .admin-page .section-heading {
          padding: .9rem 1rem;
          background: var(--surface-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
      <style jsx>{`
        .workspace-section { margin-top: 1.25rem; }
        .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .section-heading h2 { margin: 0; font-size: 1.3rem; }
        .section-heading > span { color: var(--text-secondary); font-size: .85rem; }
        .section-kicker { margin: 0 0 .4rem; text-transform: uppercase; font-size: .75rem; font-weight: 800; color: var(--accent-primary); }
        .path-list { display: flex; flex-direction: column; gap: 1rem; }
        .path-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .path-title-row { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
        .path-card h2 { margin: 0; font-size: 1.4rem; }
        .meta { margin: .45rem 0 0; color: var(--text-secondary); font-size: .8rem; }
        .description { margin: .9rem 0 .4rem; color: var(--text-secondary); }
        .tags { margin: 0; font-size: .8rem; color: var(--text-secondary); }
        .status-badge {
          padding: .3rem .65rem;
          border-radius: 999px;
          background: var(--surface-warning);
          color: var(--accent-warning);
          font-size: .7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .actions { display: flex; gap: .75rem; margin-top: 1rem; flex-wrap: wrap; }
        .error { color: var(--accent-danger); }
        .directory-list { border-top:1px solid var(--border-color); }.directory-row { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1rem 0; border-bottom:1px solid var(--border-color); }.directory-row div { display:flex; flex-direction:column; gap:.25rem; }.directory-row strong { font-size:1rem; }.directory-row span { color:var(--text-secondary); font-size:.85rem; text-transform:capitalize; } @media(max-width:640px) { .directory-row { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </div>
  );
}
