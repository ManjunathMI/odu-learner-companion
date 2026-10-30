'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import LearningContent from '@/components/LearningContent';
import { studyTime } from '@/lib/learning-material';
import MultilingualLoader from '@/components/MultilingualLoader';

interface Item { id: string; title: string; url: string; tag: string | null; }
interface Day { id: string; dayLabel: string; title: string; hours: string | null; contentMarkdown?: string | null; items: Item[]; }
interface Phase { id: string; title: string; goal: string | null; days: Day[]; }
interface PathData { id: string; title: string; description: string | null; overviewMarkdown?: string | null; tags: string[] | null; visibility: string; wallStatus: string; myRole: string | null; membershipStatus: string | null; }
interface Leader { userId: string; displayName: string; doneCount: number; total: number; }
interface SavedNote { id: string; itemId: string; text: string; createdAt: string; }
interface ProgressData { completedItemIds: string[]; }
type NoteStatus = 'idle' | 'saving' | 'saved' | 'error';

async function fetchBoardData(pathId: string) {
  const pathData = await apiFetch<PathData>(`/paths/${pathId}`);
  if (!pathData.myRole) return { pathData, phases: [] as Phase[], leaders: [] as Leader[], completedItemIds: [] as string[], savedNotes: [] as SavedNote[] };
  const [plan, leaderboard, progress, savedNotes] = await Promise.all([
    apiFetch<{ phases: Phase[] }>(`/paths/${pathId}/plan`),
    apiFetch<Leader[]>(`/paths/${pathId}/leaderboard`),
    apiFetch<ProgressData>(`/paths/${pathId}/progress`),
    apiFetch<SavedNote[]>(`/paths/${pathId}/notes`),
  ]);
  return { pathData, phases: plan.phases, leaders: leaderboard, completedItemIds: progress.completedItemIds, savedNotes };
}

export default function PathBoard({ pathId }: { pathId: string }) {
  const router = useRouter();
  const [path, setPath] = useState<PathData | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');
  const [joining, setJoining] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteStatus, setNoteStatus] = useState<Record<string, NoteStatus>>({});
  const [tab, setTab] = useState<'plan' | 'leaderboard'>('plan');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBoardData(pathId);
      setPath(data.pathData); setPhases(data.phases); setLeaders(data.leaders); setDone(Object.fromEntries(data.completedItemIds.map((itemId) => [itemId, true]))); setSavedNotes(data.savedNotes); setNotes(Object.fromEntries([...data.savedNotes].reverse().map((note) => [note.itemId, note.text]))); setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this path');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    void fetchBoardData(pathId).then((data) => {
      if (active) { setPath(data.pathData); setPhases(data.phases); setLeaders(data.leaders); setDone(Object.fromEntries(data.completedItemIds.map((itemId) => [itemId, true]))); setSavedNotes(data.savedNotes); setNotes(Object.fromEntries([...data.savedNotes].reverse().map((note) => [note.itemId, note.text]))); setError(''); }
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
    } catch { setDone((current) => ({ ...current, [itemId]: !next })); setNotice('Could not update progress. Please try again.'); }
  };

  const saveNote = async (itemId: string) => {
    const text = notes[itemId]?.trim();
    if (!text) return;
    setNoteStatus((current) => ({ ...current, [itemId]: 'saving' }));
    try {
      const saved = await apiFetch<SavedNote>(`/paths/${pathId}/notes`, { method: 'POST', body: { itemId, text } });
      setSavedNotes((current) => [saved, ...current]);
      setNoteStatus((current) => ({ ...current, [itemId]: 'saved' }));
    } catch {
      setNoteStatus((current) => ({ ...current, [itemId]: 'error' }));
    }
  };

  const join = async () => {
    if (joining) return;
    setJoining(true); setNotice('');
    try {
      await apiFetch(`/paths/${pathId}/join`, { method: 'POST', body: {} });
      setPath((current) => current ? { ...current, membershipStatus: 'pending' } : current);
      setNotice('Join request submitted. A facilitator will review your request. You can check its status in My Journey.');
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        router.push(`/auth?next=${encodeURIComponent(`/paths/${pathId}`)}`);
      } else { setNotice(err instanceof Error ? err.message : 'Unable to submit join request.'); }
    }
    finally { setJoining(false); }
  };

  if (loading) return <MultilingualLoader message="Preparing your Learning Space" />;
  if (error || !path) return <main className="board state-panel"><p className="eyebrow">Learning Space</p><h1>We could not open this space.</h1><p>{error || 'Path not found'}</p><button className="button-secondary" type="button" onClick={load}>Try again</button></main>;

  const items = phases.flatMap((phase) => phase.days.flatMap((day) => day.items));
  const completedCount = items.filter((item) => done[item.id]).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  const nextItem = items.find((item) => !done[item.id]);
  const nextDay = phases.flatMap(phase => phase.days).find(day => day.items.some(item => item.id === nextItem?.id));
  const selectedDay = activeDay ?? nextDay?.id ?? phases[0]?.days[0]?.id;
  const hasLibrary = /^##\s+(?:optional\s+)?reference library\s*$/im.test(path.overviewMarkdown ?? '');

  return (
    <div className="board">
      <header className="board-header">
        <div>
          <p className="eyebrow">Learning Space · {path.myRole || 'visitor'}</p>
          <h1>{path.title}</h1>
          {path.description && <p>{path.description}</p>}{!!path.tags?.length && <ul className="path-tags" aria-label="Path topics">{path.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
        </div>
        <div className="header-actions">
          {!path.myRole && <button className="button-primary" disabled={joining || path.membershipStatus === 'pending' || path.membershipStatus === 'rejected'} onClick={join}>{joining ? 'Submitting…' : path.membershipStatus === 'pending' ? 'Request pending' : path.membershipStatus === 'rejected' ? 'Request declined' : 'Request to join'}</button>}
          {path.myRole && <button className="button-secondary" onClick={load}>Refresh</button>}
          {path.myRole === 'admin' && (
            <Link className="button-secondary" href={`/paths/${pathId}/settings`}>
              Edit path
            </Link>
          )}
        </div>
      </header>
      <div className="course-information">
        <details className="learning-material"><summary>About this learning path</summary>{path.overviewMarkdown ? <LearningContent markdown={path.overviewMarkdown} view="overview" /> : <p className="muted">Detailed overview, prerequisites and outcomes have not been added yet.</p>}{path.myRole === 'admin' && <Link href={`/paths/${pathId}/settings#path-material`}>Edit overview &amp; references →</Link>}</details>
        <details className="learning-material"><summary>Reference library · optional reading</summary>{hasLibrary && path.overviewMarkdown ? <LearningContent markdown={path.overviewMarkdown} view="library" /> : <p className="muted">Optional reference material has not been added yet. Daily lesson resources are listed within each day.</p>}{path.myRole === 'admin' && <Link href={`/paths/${pathId}/settings#path-material`}>Add or edit references →</Link>}</details>
      </div>
      {notice && <p role="status">{notice} <Link href="/journey">My Journey</Link></p>}
      {!path.myRole && <p className="state">This public Learning Space is open for discovery. Request membership to view its plan and learn with the community.</p>}
      {path.myRole && <>
        <section className="progress-summary" aria-label="Your learning progress">
          <div className="progress-copy"><p className="section-label">Your learning progress</p><strong>{completedCount} of {items.length} lessons complete</strong>{nextItem ? <span className="next-action">Next up: <a href={`#day-${nextDay?.id}`} onClick={() => { if (nextDay) setActiveDay(nextDay.id); setTab('plan'); }}>{nextItem.title}</a></span> : <span>Every lesson is complete.</span>}</div>
          <div className="progress-meter"><span>{progressPercent}%</span><div className="meter-track"><i style={{ width: `${progressPercent}%` }} /></div></div>
        </section>
        <div className="tabs" role="tablist" aria-label="Learning Space views">
          <button id="plan-tab" role="tab" aria-controls="plan-panel" aria-selected={tab === 'plan'} className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>Learning plan</button>
          <button id="progress-tab" role="tab" aria-controls="progress-panel" aria-selected={tab === 'leaderboard'} className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Community progress</button>
        </div>
      </>}

      {path.myRole && tab === 'leaderboard' ? (
        <ol id="progress-panel" className="leaderboard" role="tabpanel" aria-labelledby="progress-tab" tabIndex={0}>
          {leaders.map((leader, index) => <li key={leader.userId}><span>#{index + 1} {leader.displayName}</span><strong>{leader.doneCount}/{leader.total}</strong></li>)}
          {!leaders.length && <p className="state">No approved learners yet.</p>}
        </ol>
      ) : path.myRole ? (
        <div id="plan-panel" className="plan" role="tabpanel" aria-labelledby="plan-tab" tabIndex={0}>
          <p className="plan-intro">Open a day to learn and practise. Choose a resource by its title, then mark the activity complete when you are ready.</p>
          {phases.map((phase, phaseIndex) => <section className="phase" key={phase.id}>
            {(phase.days.length !== 1 || phase.days[0].title !== phase.title) && <div className="phase-heading"><span>{String(phaseIndex + 1).padStart(2, '0')}</span><div><h2>{phase.title}</h2>{phase.goal && <p className="muted">{phase.goal}</p>}</div></div>}
            {phase.days.map(day => <details className="day-card" id={`day-${day.id}`} key={day.id} open={selectedDay === day.id}>
              <summary onClick={event => { event.preventDefault(); setActiveDay(selectedDay === day.id ? '' : day.id); }}>
                <span className="day-summary-copy"><span className="day-meta">{day.dayLabel}{day.hours && <> · {studyTime(day.hours)}</>}</span><span className="day-title">{day.title}</span></span>
                <span className="day-summary-status"><span>{day.items.filter(item => done[item.id]).length}/{day.items.length} complete</span><span className="day-expand">{selectedDay === day.id ? 'Close lesson −' : 'Open lesson +'}</span></span>
              </summary>
              <div className="day-body">
                <div className="lesson-layout">
                  <div className="lesson-teaching">{day.contentMarkdown ? <LearningContent markdown={day.contentMarkdown} view="lesson" /> : <>{phase.days.length === 1 && phase.goal && <p className="muted">{phase.goal}</p>}<p className="muted">Lesson explanations and practice activities have not been added yet. Start with the resources listed here.</p>{path.myRole === 'admin' && <Link href={`/paths/${pathId}/settings#day-material-${day.id}`}>Add lesson material →</Link>}</>}</div>
                  <aside className="lesson-resources" aria-label={`${day.dayLabel} resources`}><h3>Resources &amp; references</h3><p className="muted">Select a title to open it in a new tab.</p>
                    <LearningContent markdown={day.contentMarkdown ?? ''} view="resources" resources={day.items.filter(item => item.url).map(item => ({ title: day.contentMarkdown ? 'Open supporting resource' : item.title, url: item.url }))} />
                  </aside>
                </div>
                {day.contentMarkdown && <div className="lesson-practice"><LearningContent markdown={day.contentMarkdown} view="practice" /></div>}
                <div className="completion-area"><p className="section-label">Complete &amp; reflect</p>
                {day.items.map(item => <article className="item" id={`lesson-${item.id}`} key={item.id}>
                  <label className={done[item.id] ? 'complete' : ''}><input type="checkbox" checked={!!done[item.id]} onChange={() => toggle(item.id)} /> <span>{item.title}</span></label>
                <details><summary>Personal notes — only you can read these</summary><textarea value={notes[item.id] || ''} onChange={(e) => { setNotes((current) => ({ ...current, [item.id]: e.target.value })); setNoteStatus((current) => ({ ...current, [item.id]: 'idle' })); }} placeholder="Capture an idea, question, or useful reference" /><div className="note-actions"><button className="button-secondary" disabled={!notes[item.id]?.trim() || noteStatus[item.id] === 'saving'} onClick={() => saveNote(item.id)}>{noteStatus[item.id] === 'saving' ? 'Saving...' : 'Save note'}</button>{noteStatus[item.id] === 'saved' && <span className="note-status saved">Note saved</span>}{noteStatus[item.id] === 'error' && <span className="note-status error">Could not save note</span>}</div>{savedNotes.some((note) => note.itemId === item.id) && <details><summary>Saved note history</summary>{savedNotes.filter((note) => note.itemId === item.id).map((note) => <p key={note.id}><small>{new Date(note.createdAt).toLocaleString()}</small><br />{note.text}</p>)}</details>}</details>
                </article>)}
                </div>
              </div>
            </details>)}
          </section>)}
          {!phases.length && <p className="state">This path has no plan yet.</p>}
        </div>
      ) : null}
      <style jsx>{`
        .board { max-width: 1000px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; }.board-header { display:flex; justify-content:space-between; gap:2rem; border-bottom:1px solid var(--border-color); padding-bottom:2rem; }.header-actions { display:flex; gap:.5rem; align-items:flex-start; flex-wrap:wrap; }.board h1 { margin:.25rem 0; font-size:2.7rem; }.board h2 { margin:0; font-size:1.5rem; }.board h3 { margin:0 0 .85rem; font-family:var(--font-sans); font-size:1rem; }.board small,.muted,.board-header p { color:var(--text-secondary); }.eyebrow,.section-label { text-transform:uppercase; letter-spacing:.08em; font-size:.72rem; font-weight:800; color:var(--accent-primary); }.progress-summary { display:flex; justify-content:space-between; gap:2rem; align-items:center; margin:1.75rem 0 1.25rem; padding:1.25rem 1.4rem; border:1px solid var(--border-color); border-left:4px solid var(--accent-secondary); background:var(--bg-secondary); }.progress-copy { display:flex; flex-direction:column; gap:.28rem; }.progress-copy p { margin:0; }.progress-copy strong { font-size:1.05rem; }.progress-copy span { color:var(--text-secondary); font-size:.9rem; }.progress-meter { min-width:180px; text-align:right; color:var(--accent-secondary); font-size:.85rem; font-weight:800; }.meter-track { height:7px; margin-top:.45rem; background:var(--bg-tertiary); overflow:hidden; }.meter-track i { display:block; height:100%; background:var(--accent-secondary); transition:width .2s ease; }.tabs { display:flex; gap:.25rem; margin:1rem 0 1.5rem; border-bottom:1px solid var(--border-color); }.tabs button { border:0; border-bottom:2px solid transparent; background:none; padding:.75rem 1rem; cursor:pointer; color:var(--text-secondary); font-weight:700; }.tabs button.active { color:var(--accent-primary); border-bottom-color:var(--accent-primary); }.phase { margin:2rem 0; }.phase-heading { display:flex; gap:.85rem; align-items:flex-start; margin-bottom:1.25rem; }.phase-heading > span { color:var(--accent-primary); font-size:.78rem; font-weight:800; padding-top:.2rem; }.phase-heading .muted { margin:.35rem 0 0; }.day { border-top:1px solid var(--border-color); padding:1.25rem 0; }.item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:.7rem 1rem; padding:1rem; margin:.55rem 0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-md); }.item label { display:flex; gap:.65rem; align-items:center; font-weight:700; cursor:pointer; }.item label.complete span { color:var(--text-secondary); text-decoration:line-through; }.item input { accent-color:var(--accent-secondary); width:1rem; height:1rem; }.item-actions { display:flex; align-items:center; justify-content:flex-end; gap:.75rem; }.item a { font-size:.84rem; font-weight:700; }.item-tag { color:var(--text-secondary); font-size:.72rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }.item details { grid-column:1 / -1; color:var(--text-secondary); }.item summary { cursor:pointer; font-size:.85rem; font-weight:700; }.item textarea { display:block; width:100%; margin:.7rem 0; min-height:5rem; }.note-actions { display:flex; align-items:center; gap:.75rem; }.note-status { font-size:.82rem; font-weight:700; }.note-status.saved { color:var(--accent-secondary); }.note-status.error,.state.error { color:var(--accent-danger); }.leaderboard { list-style:none; padding:0; max-width:660px; }.leaderboard li { display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid var(--border-color); }.state { padding:3rem 0; color:var(--text-secondary); } @media (max-width:640px) { .board { padding:2.5rem 1rem 4rem; }.board-header,.progress-summary { align-items:flex-start; flex-direction:column; }.board h1 { font-size:2.15rem; }.progress-meter { min-width:100%; text-align:left; }.item { grid-template-columns:1fr; }.item-actions { justify-content:flex-start; }.tabs { overflow-x:auto; }.tabs button { white-space:nowrap; }.note-actions { align-items:flex-start; flex-direction:column; } }
        .path-tags { display:flex;gap:.4rem;flex-wrap:wrap;list-style:none;padding:0;margin:1rem 0 0; }.path-tags li { border:1px solid var(--border-color);border-radius:var(--radius-md);padding:.25rem .55rem;font-size:.75rem;color:var(--text-secondary); }.board-header>div:first-child { min-width:0; }.header-actions { flex-shrink:0; max-width:220px; }.header-actions a,.header-actions button { white-space:nowrap; }.board h1 { font-size:clamp(1.9rem,3.5vw,2.7rem);line-height:1.15;text-wrap:balance; }.course-information { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start; }.plan-intro { color:var(--text-secondary);font-size:.92rem;line-height:1.6; }.phase { margin:1rem 0; }.day-card { border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary);scroll-margin-top:7rem;margin:.8rem 0; }.day-card>summary { display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.2rem;list-style:none;cursor:pointer; }.day-card>summary::-webkit-details-marker { display:none; }.day-card>summary:hover { background:var(--bg-tertiary); }.day-card>summary:focus-visible { outline:2px solid var(--accent-primary);outline-offset:3px; }.day-summary-copy,.day-summary-status { display:flex;flex-direction:column;gap:.4rem; }.day-meta { color:var(--text-secondary);font-size:.8rem; }.day-title { font-weight:750;line-height:1.4; }.day-summary-status { text-align:right;flex-shrink:0;font-size:.78rem;color:var(--text-secondary); }.day-expand { color:var(--accent-primary);font-weight:700; }.day-body { border-top:1px solid var(--border-color);padding:1.4rem; }.lesson-layout { display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.65fr);gap:2rem;align-items:start; }.lesson-teaching { min-width:0; }.lesson-resources { border-left:1px solid var(--border-color);padding-left:1.4rem;min-width:0; }.lesson-resources>p { font-size:.85rem;line-height:1.5; }.lesson-practice { margin-top:1.5rem; }.completion-area { margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-color); }.completion-area .item { grid-template-columns:1fr;background:var(--bg-primary); }.completion-area .item label { align-items:flex-start;line-height:1.5; }.completion-area .item input { flex-shrink:0;margin-top:.22rem; } @media(max-width:760px) { .board-header { flex-direction:column;gap:1rem; }.header-actions { max-width:none; }.course-information,.lesson-layout { grid-template-columns:1fr; }.course-information { gap:0; }.lesson-resources { border-left:0;border-top:1px solid var(--border-color);padding:1rem 0 0; }.day-card>summary { align-items:flex-start;padding:1rem; }.day-body { padding:1rem; }.day-title { font-size:.95rem; }.day-summary-status { max-width:100px; } }
      `}</style>
    </div>
  );
}
