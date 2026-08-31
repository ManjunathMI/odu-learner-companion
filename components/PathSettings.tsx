'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props { pathId: string; }

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'learner';
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  display_name?: string | null;
}

type PlanTag = 'hands' | 'exam' | '';

interface PlanItem {
  title: string;
  url: string;
  tag: PlanTag;
}

interface PlanDay {
  dayLabel: string;
  title: string;
  hours: string;
  items: PlanItem[];
}

interface PlanPhase {
  title: string;
  goal: string;
  days: PlanDay[];
}

interface PlanData {
  phases: PlanPhase[];
}

const emptyItem = (): PlanItem => ({ title: '', url: '', tag: 'hands' });
const emptyDay = (): PlanDay => ({ dayLabel: 'Day 1', title: '', hours: '', items: [emptyItem()] });
const emptyPhase = (): PlanPhase => ({ title: '', goal: '', days: [emptyDay()] });

function normalizePlan(raw: Partial<{ phases?: PlanPhase[] }> | null | undefined): PlanData {
  const phases = Array.isArray(raw?.phases) && raw.phases.length ? raw.phases : [emptyPhase()];
  return {
    phases: phases.map((phase) => ({
      title: phase.title ?? '',
      goal: phase.goal ?? '',
      days: Array.isArray(phase.days) && phase.days.length ? phase.days.map((day) => ({
        dayLabel: day.dayLabel ?? 'Day 1',
        title: day.title ?? '',
        hours: day.hours ?? '',
        items: Array.isArray(day.items) && day.items.length ? day.items.map((item) => ({
          title: item.title ?? '',
          url: item.url ?? '',
          tag: item.tag === 'exam' ? 'exam' : 'hands',
        })) : [emptyItem()],
      })) : [emptyDay()],
    })),
  };
}

export default function PathSettings({ pathId }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [plan, setPlan] = useState<PlanData>({ phases: [emptyPhase()] });
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actioningUser, setActioningUser] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ title: string; description: string | null; visibility: string }>(`/paths/${pathId}`),
      apiFetch<{ phases: PlanPhase[] }>(`/paths/${pathId}/plan`),
      apiFetch<Member[]>(`/paths/${pathId}/members`),
    ]).then(([path, currentPlan, currentMembers]) => {
      setTitle(path.title); setDescription(path.description || ''); setVisibility(path.visibility);
      setPlan(normalizePlan(currentPlan));
      setMembers(currentMembers);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load settings'));
  }, [pathId]);

  const updatePhase = (phaseIndex: number, field: 'title' | 'goal', value: string) => {
    setPlan((current) => ({
      ...current,
      phases: current.phases.map((phase, index) => index === phaseIndex ? { ...phase, [field]: value } : phase),
    }));
  };

  const updateDay = (phaseIndex: number, dayIndex: number, field: 'dayLabel' | 'title' | 'hours', value: string) => {
    setPlan((current) => ({
      ...current,
      phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : {
        ...phase,
        days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : { ...day, [field]: value }),
      }),
    }));
  };

  const updateItem = (phaseIndex: number, dayIndex: number, itemIndex: number, field: 'title' | 'url' | 'tag', value: string) => {
    setPlan((current) => ({
      ...current,
      phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : {
        ...phase,
        days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : {
          ...day,
          items: day.items.map((item, itemPos) => itemPos !== itemIndex ? item : { ...item, [field]: field === 'tag' ? (value === 'exam' ? 'exam' : 'hands') : value }),
        }),
      }),
    }));
  };

  const addPhase = () => setPlan((current) => ({ ...current, phases: [...current.phases, emptyPhase()] }));
  const removePhase = (phaseIndex: number) => setPlan((current) => ({ ...current, phases: current.phases.filter((_, index) => index !== phaseIndex) || [emptyPhase()] }));
  const movePhase = (phaseIndex: number, direction: -1 | 1) => setPlan((current) => {
    const next = [...current.phases];
    const target = phaseIndex + direction;
    if (target < 0 || target >= next.length) return current;
    [next[phaseIndex], next[target]] = [next[target], next[phaseIndex]];
    return { ...current, phases: next };
  });

  const addDay = (phaseIndex: number) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, index) => index === phaseIndex ? { ...phase, days: [...phase.days, emptyDay()] } : phase) }));
  const removeDay = (phaseIndex: number, dayIndex: number) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, index) => index === phaseIndex ? { ...phase, days: phase.days.filter((_, currentDayIndex) => currentDayIndex !== dayIndex) || [emptyDay()] } : phase) }));
  const moveDay = (phaseIndex: number, dayIndex: number, direction: -1 | 1) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, index) => index !== phaseIndex ? phase : { ...phase, days: (() => { const nextDays = [...phase.days]; const target = dayIndex + direction; if (target < 0 || target >= nextDays.length) return phase.days; [nextDays[dayIndex], nextDays[target]] = [nextDays[target], nextDays[dayIndex]]; return nextDays; })() }) }));

  const addItem = (phaseIndex: number, dayIndex: number) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : { ...phase, days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : { ...day, items: [...day.items, emptyItem()] }) }) }));
  const removeItem = (phaseIndex: number, dayIndex: number, itemIndex: number) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : { ...phase, days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : { ...day, items: day.items.filter((_, index) => index !== itemIndex) || [emptyItem()] }) }) }));
  const moveItem = (phaseIndex: number, dayIndex: number, itemIndex: number, direction: -1 | 1) => setPlan((current) => ({ ...current, phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : { ...phase, days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : { ...day, items: (() => { const nextItems = [...day.items]; const target = itemIndex + direction; if (target < 0 || target >= nextItems.length) return day.items; [nextItems[itemIndex], nextItems[target]] = [nextItems[target], nextItems[itemIndex]]; return nextItems; })() }) }) }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await apiFetch(`/paths/${pathId}`, { method: 'PUT', body: { title, description, visibility } });
      await apiFetch(`/paths/${pathId}/plan`, { method: 'PUT', body: plan });
      setMessage('Settings and plan saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save settings'); }
  };

  const updateMember = async (userId: string, action: 'promote' | 'demote' | 'remove') => {
    if (action === 'remove' && !window.confirm('Remove this member from the learning path?')) return;
    setError('');
    setActioningUser(userId);
    try {
      await apiFetch(`/paths/${pathId}/members/${userId}`, { method: 'POST', body: { action } });
      setMembers((current) => {
        if (action === 'remove') return current.filter((member) => member.user_id !== userId);
        return current.map((member) => {
          if (member.user_id !== userId) return member;
          if (action === 'promote') return { ...member, role: 'moderator', status: 'approved' };
          if (action === 'demote') return { ...member, role: 'learner' };
          return member;
        });
      });
      setMessage(action === 'remove' ? 'Member removed.' : action === 'promote' ? 'Member promoted.' : 'Member demoted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update member');
    } finally {
      setActioningUser(null);
    }
  };

  return <div className="settings-page">
    <form className="settings" onSubmit={save}>
      <header className="settings-header"><div><p className="eyebrow">Path administration</p><h1>Build the learning experience</h1><p>Configure the path, shape the curriculum, and keep the right people involved.</p></div><button className="button-primary" type="submit">Save changes</button></header>
      <section className="settings-section"><div className="section-title"><p className="section-kicker">Configuration</p><h2>Path details</h2></div><div className="metadata-grid"><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Visibility<select value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="private">Private</option><option value="public">Public</option></select></label></div><label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label></section>

      <section className="plan-editor settings-section">
        <div className="section-header">
          <div><p className="section-kicker">Curriculum</p><h2>Learning plan</h2></div>
          <button type="button" className="button-secondary" onClick={addPhase}>+ Add phase</button>
        </div>

        {plan.phases.map((phase, phaseIndex) => (
          <div className="phase-card" key={`${phaseIndex}-${phase.title || 'phase'}`}>
            <div className="phase-header">
              <h3>Phase {phaseIndex + 1}</h3>
              <div className="inline-actions">
                <button type="button" className="button-secondary" onClick={() => movePhase(phaseIndex, -1)} disabled={phaseIndex === 0}>↑</button>
                <button type="button" className="button-secondary" onClick={() => movePhase(phaseIndex, 1)} disabled={phaseIndex === plan.phases.length - 1}>↓</button>
                <button type="button" className="button-secondary" onClick={() => removePhase(phaseIndex)}>Remove</button>
              </div>
            </div>

            <label>Phase title<input value={phase.title} onChange={(e) => updatePhase(phaseIndex, 'title', e.target.value)} placeholder="Foundations" /></label>
            <label>Phase goal<textarea value={phase.goal} onChange={(e) => updatePhase(phaseIndex, 'goal', e.target.value)} placeholder="What should learners accomplish in this phase?" /></label>

            {phase.days.map((day, dayIndex) => (
              <div className="day-card" key={`${phaseIndex}-${dayIndex}-${day.dayLabel}`}>
                <div className="day-header">
                  <h4>Day {dayIndex + 1}</h4>
                  <div className="inline-actions">
                    <button type="button" className="button-secondary" onClick={() => moveDay(phaseIndex, dayIndex, -1)} disabled={dayIndex === 0}>↑</button>
                    <button type="button" className="button-secondary" onClick={() => moveDay(phaseIndex, dayIndex, 1)} disabled={dayIndex === phase.days.length - 1}>↓</button>
                    <button type="button" className="button-secondary" onClick={() => removeDay(phaseIndex, dayIndex)}>Remove day</button>
                  </div>
                </div>

                <div className="row-grid">
                  <label>Day label<input value={day.dayLabel} onChange={(e) => updateDay(phaseIndex, dayIndex, 'dayLabel', e.target.value)} placeholder="Day 1" /></label>
                  <label>Day title<input value={day.title} onChange={(e) => updateDay(phaseIndex, dayIndex, 'title', e.target.value)} placeholder="Workshop" /></label>
                  <label>Hours<input value={day.hours} onChange={(e) => updateDay(phaseIndex, dayIndex, 'hours', e.target.value)} placeholder="2" /></label>
                </div>

                <div className="items-section">
                  <div className="items-header">
                    <h5>Lesson items</h5>
                    <button type="button" className="button-secondary" onClick={() => addItem(phaseIndex, dayIndex)}>+ Add item</button>
                  </div>

                  {day.items.map((item, itemIndex) => (
                    <div className="item-card" key={`${phaseIndex}-${dayIndex}-${itemIndex}`}>
                      <div className="inline-actions">
                        <button type="button" className="button-secondary" onClick={() => moveItem(phaseIndex, dayIndex, itemIndex, -1)} disabled={itemIndex === 0}>↑</button>
                        <button type="button" className="button-secondary" onClick={() => moveItem(phaseIndex, dayIndex, itemIndex, 1)} disabled={itemIndex === day.items.length - 1}>↓</button>
                        <button type="button" className="button-secondary" onClick={() => removeItem(phaseIndex, dayIndex, itemIndex)}>Remove</button>
                      </div>

                      <div className="row-grid item-grid">
                        <label>Title<input value={item.title} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'title', e.target.value)} placeholder="Read chapter" /></label>
                        <label>URL<input value={item.url} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'url', e.target.value)} placeholder="https://" /></label>
                        <label>Type<select value={item.tag || 'hands'} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'tag', e.target.value)}>
                          <option value="hands">Hands-on</option>
                          <option value="exam">Exam</option>
                        </select></label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="button" className="button-secondary" onClick={() => addDay(phaseIndex)}>+ Add day</button>
          </div>
        ))}
      </section>

      {(error || message) && <p className={error ? 'error feedback' : 'success feedback'}>{error || message}</p>}
      <div className="save-bar"><span>Changes are saved only when you select Save changes.</span><button className="button-primary" type="submit">Save changes</button></div>
    </form>

    <section className="members-panel">
      <div className="members-header">
        <div><p className="section-kicker">People</p><h2>Members</h2></div>
      </div>
      {members.length === 0 ? <p className="empty-state">No members yet.</p> : (
        <div className="member-list">
          {members.map((member) => {
            const label = member.display_name || member.user_id;
            const isAdmin = member.role === 'admin';
            return (
              <div className="member-row" key={member.id}>
                <div className="member-summary">
                  <strong>{label}</strong>
                  <span className={`role-badge ${member.role}`}>{member.role}</span>
                  <span className={`status-badge ${member.status}`}>{member.status}</span>
                </div>
                {!isAdmin && (
                  <div className="member-actions">
                    {member.role !== 'moderator' && member.status === 'approved' && (
                      <button type="button" className="button-secondary" disabled={actioningUser === member.user_id} onClick={() => updateMember(member.user_id, 'promote')}>
                        Promote to moderator
                      </button>
                    )}
                    {member.role === 'moderator' && (
                      <button type="button" className="button-secondary" disabled={actioningUser === member.user_id} onClick={() => updateMember(member.user_id, 'demote')}>
                        Demote to learner
                      </button>
                    )}
                    <button type="button" className="button-danger" disabled={actioningUser === member.user_id} onClick={() => updateMember(member.user_id, 'remove')}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>

    <style jsx>{`
      .settings-page { max-width: 1020px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; display: flex; flex-direction: column; gap: 2rem; }.settings { display: flex; flex-direction: column; gap: 1.5rem; }.settings-header { display:flex; justify-content:space-between; align-items:flex-end; gap:2rem; padding-bottom:2rem; border-bottom:1px solid var(--border-color); }.settings h1 { margin:0; font-size:2.6rem; }.settings-header p:not(.eyebrow) { color:var(--text-secondary); margin:.65rem 0 0; max-width:600px; }.eyebrow,.section-kicker { color:var(--accent-primary); font-size:.75rem; font-weight:800; letter-spacing:.08em; margin:0 0 .4rem; text-transform:uppercase; }.settings-section { border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.4rem; background:var(--bg-secondary); }.section-title { margin-bottom:1rem; }.section-title h2 { margin:0; font-size:1.35rem; }.metadata-grid { display:grid; grid-template-columns:2fr 1fr; gap:.75rem; }
      .settings label { display: flex; flex-direction: column; gap: .4rem; font-weight: 600; }
      .plan-editor { display: flex; flex-direction: column; gap: 1rem; }
      .section-header, .phase-header, .day-header, .items-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
      .phase-card, .day-card, .item-card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: .9rem; }
      .phase-card { margin-top: .5rem; }
      .row-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .75rem; }
      .inline-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
      .item-card { padding: .75rem; }
      .items-section { display: flex; flex-direction: column; gap: .75rem; }
      .error { color: var(--accent-danger); }.success { color: var(--accent-secondary); }.feedback { margin:0; font-weight:700; }.save-bar { align-items:center; background:var(--bg-tertiary); border:1px solid var(--border-color); display:flex; justify-content:space-between; gap:1rem; padding:.85rem 1rem; color:var(--text-secondary); font-size:.88rem; }.members-panel { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.4rem; }
      .members-header h2 { margin: 0 0 1rem; }
      .member-list { display: flex; flex-direction: column; gap: .75rem; }
      .member-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid var(--border-color); }
      .member-row:last-child { border-bottom: 0; }
      .member-summary { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
      .member-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
      .role-badge, .status-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: .2rem .55rem; font-size: .7rem; font-weight: 700; text-transform: uppercase; }
      .role-badge.admin { background: rgba(59,130,246,.12); color: var(--accent-primary); }
      .role-badge.moderator { background: rgba(168,85,247,.12); color: #a855f7; }
      .role-badge.learner { background: rgba(16,185,129,.12); color: #059669; }
      .status-badge.approved { background: rgba(16,185,129,.12); color: #059669; }
      .status-badge.pending { background: rgba(234,179,8,.12); color: #b45309; }
      .status-badge.rejected { background: rgba(239,68,68,.12); color: #b91c1c; }
      .button-danger { background: rgba(239,68,68,.12); color: var(--accent-danger); border: 1px solid rgba(239,68,68,.25); border-radius: var(--radius-md); padding: .55rem .9rem; cursor: pointer; }
      .empty-state { color: var(--text-secondary); } @media(max-width:640px) { .settings-page { padding:2.5rem 1rem 4rem; }.settings-header { align-items:flex-start; flex-direction:column; }.settings h1 { font-size:2.1rem; }.metadata-grid { grid-template-columns:1fr; }.save-bar { align-items:flex-start; flex-direction:column; }.member-row { align-items:flex-start; flex-direction:column; } }
    `}</style>
  </div>;
}
