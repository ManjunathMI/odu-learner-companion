'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Request { id: string; user_id: string; role: string; status: string; joined_at: string; }

export default function ApprovalsPanel({ pathId }: { pathId: string }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try { setRequests(await apiFetch<Request[]>(`/paths/${pathId}/approvals`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load approvals'); }
  };
  useEffect(() => { load(); }, [pathId]);

  const decide = async (userId: string, decision: 'approved' | 'rejected') => {
    try {
      await apiFetch(`/paths/${pathId}/approvals/${userId}`, { method: 'POST', body: { decision } });
      setRequests((current) => current.filter((request) => request.user_id !== userId));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update request'); }
  };

  return <div className="approvals"><h1>Join requests</h1>{error && <p className="error">{error}</p>}{requests.map((request) => <div className="request" key={request.id}><span>{request.user_id}<small>{new Date(request.joined_at).toLocaleString()}</small></span><span><button className="button-primary" onClick={() => decide(request.user_id, 'approved')}>Approve</button><button className="button-secondary" onClick={() => decide(request.user_id, 'rejected')}>Reject</button></span></div>)}{!requests.length && !error && <p>No pending requests.</p>}<style jsx>{`.approvals{max-width:800px;margin:0 auto;padding:2rem 1rem}.request{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--border-color)}small{display:block;color:var(--text-secondary);margin-top:.25rem}.request button{margin-left:.5rem}.error{color:var(--accent-danger)}`}</style></div>;
}
