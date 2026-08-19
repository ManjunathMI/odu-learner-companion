'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Item { id: string; title: string; url: string; tag: string | null; }
interface Day { id: string; dayLabel: string; title: string; hours: string | null; items: Item[]; }
interface Phase { id: string; title: string; goal: string | null; days: Day[]; }
interface PathData { id: string; title: string; description: string | null; tags: string[] | null; visibility: string; wallStatus: string; myRole: string | null; }
interface Leader { userId: string; displayName: string; doneCount: number; total: number; }

export default function PathBoard({ pathId }: { pathId: string }) {
  const [path, setPath] = useState<PathData | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'plan' | 'leaderboard'>('plan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const pathData = await apiFetch<PathData>(`/paths/${pathId}`);
      setPath(pathData);
      if (pathData.myRole) {
        const [plan, leaderboard] = await Promise.all([
          apiFetch<{ phases: Phase[] }>(`/paths/${pathId}/plan`),
          apiFetch<Leader[]>(`/paths/${pathId}/leaderboard`),
        ]);
        setPhases(plan.phases);
        setLeaders(leaderboard);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this path');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [pathId]);

  const toggle = async (itemId: string) => {
    const next = !done[itemId];
    setDone((current) => ({ ...current, [itemId]: next }));
    try {
      await apiFetch(`/paths/${pathId}/progress`, { method: 'POST', body: { itemId, done: next } });
      const leaderboard = await apiFetch<Leader[]>(`/paths/${pathId}/leaderboard`);
      setLeaders(leaderboard);
    } catch { setDone((current) => ({ ...current, [itemId]: !next })); }
  };

  const saveNote = async (itemId: string) => {
    const text = notes[itemId]?.trim();
    if (!text) return;
    await apiFetch(`/paths/${pathId}/notes`, { method: 'POST', body: { itemId, text } });
  };

  const join = async () => {
    try {
      await apiFetch(`/paths/${pathId}/join`, { method: 'POST', body: {} });
      setError('Join request submitted. An administrator must approve it.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit join request'); }
  };

  if (loading) return <p className="state">Loading path…</p>;
  if (error || !path) return <p className="state error">{error || 'Path not found'}</p>;

  return (
    <div className="board">
      <header className="board-header">
        <div>
          <p className="eyebrow">{path.visibility} path · {path.myRole || 'visitor'}</p>
          <h1>{path.title}</h1>
          {path.description && <p>{path.description}</p>}
        </div>
        <div className="header-actions">
          {!path.myRole && <button className="button-primary" onClick={join}>Request to join</button>}
          {path.myRole && <button className="button-secondary" onClick={load}>Refresh</button>}
        </div>
      </header>
      {!path.myRole && <p className="state">This path is public. Request membership to view its plan and participate.</p>}
      {path.myRole && <div className="tabs">
        <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>Plan</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
      </div>}

      {path.myRole && tab === 'leaderboard' ? (
        <ol className="leaderboard">
          {leaders.map((leader, index) => <li key={leader.userId}><span>#{index + 1} {leader.displayName}</span><strong>{leader.doneCount}/{leader.total}</strong></li>)}
          {!leaders.length && <p className="state">No approved learners yet.</p>}
        </ol>
      ) : path.myRole ? (
        <div className="plan">
          {phases.map((phase) => <section className="phase" key={phase.id}>
            <h2>{phase.title}</h2>
            {phase.goal && <p className="muted">{phase.goal}</p>}
            {phase.days.map((day) => <div className="day" key={day.id}>
              <h3>{day.dayLabel}: {day.title} {day.hours && <small>({day.hours} hours)</small>}</h3>
              {day.items.map((item) => <article className="item" key={item.id}>
                <label><input type="checkbox" checked={!!done[item.id]} onChange={() => toggle(item.id)} /> <span>{item.title}</span></label>
                {item.url && <a href={item.url} target="_blank" rel="noreferrer">Open resource</a>}
                <details><summary>Notes</summary><textarea value={notes[item.id] || ''} onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="Add a note" /><button className="button-secondary" onClick={() => saveNote(item.id)}>Save note</button></details>
              </article>)}
            </div>)}
          </section>)}
          {!phases.length && <p className="state">This path has no plan yet.</p>}
        </div>
      ) : null}
      <style jsx>{`
        .board { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }
        .board-header { display:flex; justify-content:space-between; gap:1rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem; } .header-actions { display:flex; gap:.5rem; align-items:flex-start; }
        h1 { margin:.25rem 0; font-size:2rem; } h2 { margin:0; } h3 { margin:0 0 .75rem; font-size:1rem; } small,.muted,.board-header p { color:var(--text-secondary); }
        .eyebrow { text-transform:uppercase; letter-spacing:.08em; font-size:.72rem; font-weight:700; }
        .tabs { display:flex; gap:.5rem; margin:1rem 0; border-bottom:1px solid var(--border-color); } .tabs button { border:0; border-bottom:2px solid transparent; background:none; padding:.75rem 1rem; cursor:pointer; color:var(--text-secondary); } .tabs button.active { color:var(--accent-primary); border-bottom-color:var(--accent-primary); }
        .phase { margin:1.5rem 0; } .day { border-top:1px solid var(--border-color); padding:1rem 0; } .item { padding:.75rem; margin:.5rem 0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); } .item label { display:flex; gap:.5rem; align-items:center; font-weight:600; } .item a { display:inline-block; margin:.5rem 0; font-size:.85rem; } details { color:var(--text-secondary); } textarea { display:block; width:100%; margin:.5rem 0; min-height:4rem; } .leaderboard { list-style:none; padding:0; max-width:600px; } .leaderboard li { display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid var(--border-color); } .state { padding:3rem 0; color:var(--text-secondary); } .error { color:var(--accent-danger); }
      `}</style>
    </div>
  );
}
