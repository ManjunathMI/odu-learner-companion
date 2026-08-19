'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props { pathId: string; }

export default function PathSettings({ pathId }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [plan, setPlan] = useState('{\n  "phases": []\n}');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<{ title: string; description: string | null; visibility: string }>(`/paths/${pathId}`),
      apiFetch<{ phases: unknown[] }>(`/paths/${pathId}/plan`),
    ]).then(([path, currentPlan]) => {
      setTitle(path.title); setDescription(path.description || ''); setVisibility(path.visibility);
      setPlan(JSON.stringify(currentPlan, null, 2));
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load settings'));
  }, [pathId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const parsedPlan = JSON.parse(plan);
      await apiFetch(`/paths/${pathId}`, { method: 'PUT', body: { title, description, visibility } });
      await apiFetch(`/paths/${pathId}/plan`, { method: 'PUT', body: parsedPlan });
      setMessage('Settings and plan saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save settings'); }
  };

  return <form className="settings" onSubmit={save}>
    <h1>Path settings</h1>
    <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
    <label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
    <label>Visibility<select value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="private">Private</option><option value="public">Public</option></select></label>
    <label>Plan JSON<textarea className="plan-input" value={plan} onChange={(e) => setPlan(e.target.value)} spellCheck={false} /></label>
    {error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}
    <button className="button-primary" type="submit">Save changes</button>
    <style jsx>{`.settings{max-width:900px;margin:0 auto;padding:2rem 1rem;display:flex;flex-direction:column;gap:1rem}.settings h1{margin:0}.settings label{display:flex;flex-direction:column;gap:.4rem;font-weight:600}.plan-input{min-height:24rem;font-family:monospace}.error{color:var(--accent-danger)}.success{color:var(--accent-primary)}`}</style>
  </form>;
}
