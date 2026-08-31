'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';

interface Item { id: string; title: string; url: string; tag: string | null; }
interface Day { id: string; dayLabel: string; title: string; hours: string | null; items: Item[]; }
interface Phase { id: string; title: string; goal: string | null; days: Day[]; }
interface PathData { id: string; title: string; description: string | null; tags: string[] | null; visibility: string; wallStatus: string; myRole: string | null; }
interface Leader { userId: string; displayName: string; doneCount: number; total: number; }
interface ProgressData { completedItemIds: string[]; }
type NoteStatus = 'idle' | 'saving' | 'saved' | 'error';

async function fetchBoardData(pathId: string) {
  const pathData = await apiFetch<PathData>(`/paths/${pathId}`);
  if (!pathData.myRole) return { pathData, phases: [] as Phase[], leaders: [] as Leader[], completedItemIds: [] as string[] };
  const [plan, leaderboard, progress] = await Promise.all([
    apiFetch<{ phases: Phase[] }>(`/paths/${pathId}/plan`),
    apiFetch<Leader[]>(`/paths/${pathId}/leaderboard`),
    apiFetch<ProgressData>(`/paths/${pathId}/progress`),
  ]);
  return { pathData, phases: plan.phases, leaders: leaderboard, completedItemIds: progress.completedItemIds };
}

export default function PathBoard({ pathId }: { pathId: string }) {
  const [path, setPath] = useState<PathData | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteStatus, setNoteStatus] = useState<Record<string, NoteStatus>>({});
  const [tab, setTab] = useState<'plan' | 'leaderboard'>('plan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBoardData(pathId);
      setPath(data.pathData); setPhases(data.phases); setLeaders(data.leaders); setDone(Object.fromEntries(data.completedItemIds.map((itemId) => [itemId, true]))); setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this path');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    void fetchBoardData(pathId).then((data) => {
      if (active) { setPath(data.pathData); setPhases(data.phases); setLeaders(data.leaders); setDone(Object.fromEntries(data.completedItemIds.map((itemId) => [itemId, true]))); setError(''); }
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load this path');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [pathId]);

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
    setNoteStatus((current) => ({ ...current, [itemId]: 'saving' }));
    try {
      await apiFetch(`/paths/${pathId}/notes`, { method: 'POST', body: { itemId, text } });
      setNoteStatus((current) => ({ ...current, [itemId]: 'saved' }));
    } catch {
      setNoteStatus((current) => ({ ...current, [itemId]: 'error' }));
    }
  };

  const join = async () => {
    try {
      await apiFetch(`/paths/${pathId}/join`, { method: 'POST', body: {} });
      setError('Join request submitted. An administrator must approve it.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit join request'); }
  };

  if (loading) return <MultilingualLoader message="Preparing your learning path" />;
  if (error || !path) return <p className="state error">{error || 'Path not found'}</p>;

  const items = phases.flatMap((phase) => phase.days.flatMap((day) => day.items));
  const completedCount = items.filter((item) => done[item.id]).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  const nextItem = items.find((item) => !done[item.id]);

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
          {path.myRole === 'admin' && (
            <Link className="button-secondary" href={`/paths/${pathId}/settings`}>
              Edit path
            </Link>
          )}
        </div>
      </header>
      {!path.myRole && <p className="state">This path is public. Request membership to view its plan and participate.</p>}
      {path.myRole && <>
        <section className="progress-summary" aria-label="Your progress">
          <div className="progress-copy"><p className="section-label">Your progress</p><strong>{completedCount} of {items.length} lessons complete</strong>{nextItem ? <span>Next: {nextItem.title}</span> : <span>Every lesson is complete.</span>}</div>
          <div className="progress-meter"><span>{progressPercent}%</span><div className="meter-track"><i style={{ width: `${progressPercent}%` }} /></div></div>
        </section>
        <div className="tabs" role="tablist" aria-label="Path views">
          <button role="tab" aria-selected={tab === 'plan'} className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>Learning plan</button>
          <button role="tab" aria-selected={tab === 'leaderboard'} className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Community progress</button>
        </div>
      </>}

      {path.myRole && tab === 'leaderboard' ? (
        <ol className="leaderboard">
          {leaders.map((leader, index) => <li key={leader.userId}><span>#{index + 1} {leader.displayName}</span><strong>{leader.doneCount}/{leader.total}</strong></li>)}
          {!leaders.length && <p className="state">No approved learners yet.</p>}
        </ol>
      ) : path.myRole ? (
        <div className="plan">
          {phases.map((phase, phaseIndex) => <section className="phase" key={phase.id}>
            <div className="phase-heading"><span>{String(phaseIndex + 1).padStart(2, '0')}</span><div><h2>{phase.title}</h2>{phase.goal && <p className="muted">{phase.goal}</p>}</div></div>
            {phase.days.map((day) => <div className="day" key={day.id}>
              <h3>{day.dayLabel}: {day.title} {day.hours && <small>({day.hours} hours)</small>}</h3>
              {day.items.map((item) => <article className="item" key={item.id}>
                <label className={done[item.id] ? 'complete' : ''}><input type="checkbox" checked={!!done[item.id]} onChange={() => toggle(item.id)} /> <span>{item.title}</span></label>
                <div className="item-actions">{item.tag && <span className="item-tag">{item.tag}</span>}{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open resource</a>}</div>
                <details><summary>Personal notes</summary><textarea value={notes[item.id] || ''} onChange={(e) => { setNotes((current) => ({ ...current, [item.id]: e.target.value })); setNoteStatus((current) => ({ ...current, [item.id]: 'idle' })); }} placeholder="Capture an idea, question, or useful reference" /><div className="note-actions"><button className="button-secondary" disabled={!notes[item.id]?.trim() || noteStatus[item.id] === 'saving'} onClick={() => saveNote(item.id)}>{noteStatus[item.id] === 'saving' ? 'Saving...' : 'Save note'}</button>{noteStatus[item.id] === 'saved' && <span className="note-status saved">Note saved</span>}{noteStatus[item.id] === 'error' && <span className="note-status error">Could not save note</span>}</div></details>
              </article>)}
            </div>)}
          </section>)}
          {!phases.length && <p className="state">This path has no plan yet.</p>}
        </div>
      ) : null}
      <style jsx>{`
        .board { max-width: 1000px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; }.board-header { display:flex; justify-content:space-between; gap:2rem; border-bottom:1px solid var(--border-color); padding-bottom:2rem; }.header-actions { display:flex; gap:.5rem; align-items:flex-start; flex-wrap:wrap; }.board h1 { margin:.25rem 0; font-size:2.7rem; }.board h2 { margin:0; font-size:1.5rem; }.board h3 { margin:0 0 .85rem; font-family:var(--font-sans); font-size:1rem; }.board small,.muted,.board-header p { color:var(--text-secondary); }.eyebrow,.section-label { text-transform:uppercase; letter-spacing:.08em; font-size:.72rem; font-weight:800; color:var(--accent-primary); }.progress-summary { display:flex; justify-content:space-between; gap:2rem; align-items:center; margin:1.75rem 0 1.25rem; padding:1.25rem 1.4rem; border:1px solid var(--border-color); border-left:4px solid var(--accent-secondary); background:var(--bg-secondary); }.progress-copy { display:flex; flex-direction:column; gap:.28rem; }.progress-copy p { margin:0; }.progress-copy strong { font-size:1.05rem; }.progress-copy span { color:var(--text-secondary); font-size:.9rem; }.progress-meter { min-width:180px; text-align:right; color:var(--accent-secondary); font-size:.85rem; font-weight:800; }.meter-track { height:7px; margin-top:.45rem; background:var(--bg-tertiary); overflow:hidden; }.meter-track i { display:block; height:100%; background:var(--accent-secondary); transition:width .2s ease; }.tabs { display:flex; gap:.25rem; margin:1rem 0 1.5rem; border-bottom:1px solid var(--border-color); }.tabs button { border:0; border-bottom:2px solid transparent; background:none; padding:.75rem 1rem; cursor:pointer; color:var(--text-secondary); font-weight:700; }.tabs button.active { color:var(--accent-primary); border-bottom-color:var(--accent-primary); }.phase { margin:2rem 0; }.phase-heading { display:flex; gap:.85rem; align-items:flex-start; margin-bottom:1.25rem; }.phase-heading > span { color:var(--accent-primary); font-size:.78rem; font-weight:800; padding-top:.2rem; }.phase-heading .muted { margin:.35rem 0 0; }.day { border-top:1px solid var(--border-color); padding:1.25rem 0; }.item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:.7rem 1rem; padding:1rem; margin:.55rem 0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); }.item label { display:flex; gap:.65rem; align-items:center; font-weight:700; cursor:pointer; }.item label.complete span { color:var(--text-secondary); text-decoration:line-through; }.item input { accent-color:var(--accent-secondary); width:1rem; height:1rem; }.item-actions { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; }.item a { font-size:.84rem; font-weight:700; }.item-tag { color:var(--text-secondary); font-size:.72rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }.item details { grid-column:1 / -1; color:var(--text-secondary); }.item summary { cursor:pointer; font-size:.85rem; font-weight:700; }.item textarea { display:block; width:100%; margin:.7rem 0; min-height:5rem; }.note-actions { display:flex; align-items:center; gap:.75rem; }.note-status { font-size:.82rem; font-weight:700; }.note-status.saved { color:var(--accent-secondary); }.note-status.error,.state.error { color:var(--accent-danger); }.leaderboard { list-style:none; padding:0; max-width:660px; }.leaderboard li { display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid var(--border-color); }.state { padding:3rem 0; color:var(--text-secondary); } @media (max-width:640px) { .board { padding:2.5rem 1rem 4rem; }.board-header,.progress-summary { align-items:flex-start; flex-direction:column; }.board h1 { font-size:2.15rem; }.progress-meter { min-width:100%; text-align:left; }.item { grid-template-columns:1fr; }.item-actions { justify-content:flex-start; }.tabs { overflow-x:auto; }.tabs button { white-space:nowrap; }.note-actions { align-items:flex-start; flex-direction:column; } }
      `}</style>
    </div>
  );
}
