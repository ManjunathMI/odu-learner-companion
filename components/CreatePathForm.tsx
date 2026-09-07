'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Props {
  onCancel: () => void;
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

export default function CreatePathForm({ onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [plan, setPlan] = useState<PlanData>({ phases: [emptyPhase()] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
          items: day.items.map((item, itemPos) => itemPos !== itemIndex ? item : {
            ...item,
            [field]: field === 'tag' ? (value === 'exam' ? 'exam' : 'hands') : value,
          }),
        }),
      }),
    }));
  };

  const addPhase = () => setPlan((current) => ({ ...current, phases: [...current.phases, emptyPhase()] }));
  const removePhase = (phaseIndex: number) => setPlan((current) => ({
    ...current,
    phases: current.phases.filter((_, index) => index !== phaseIndex).length ? current.phases.filter((_, index) => index !== phaseIndex) : [emptyPhase()],
  }));
  const movePhase = (phaseIndex: number, direction: -1 | 1) => setPlan((current) => {
    const next = [...current.phases];
    const target = phaseIndex + direction;
    if (target < 0 || target >= next.length) return current;
    [next[phaseIndex], next[target]] = [next[target], next[phaseIndex]];
    return { ...current, phases: next };
  });

  const addDay = (phaseIndex: number) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, index) => index === phaseIndex ? { ...phase, days: [...phase.days, emptyDay()] } : phase),
  }));
  const removeDay = (phaseIndex: number, dayIndex: number) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, index) => index === phaseIndex ? {
      ...phase,
      days: phase.days.filter((_, currentDayIndex) => currentDayIndex !== dayIndex).length ? phase.days.filter((_, currentDayIndex) => currentDayIndex !== dayIndex) : [emptyDay()],
    } : phase),
  }));
  const moveDay = (phaseIndex: number, dayIndex: number, direction: -1 | 1) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, index) => index !== phaseIndex ? phase : {
      ...phase,
      days: (() => {
        const nextDays = [...phase.days];
        const target = dayIndex + direction;
        if (target < 0 || target >= nextDays.length) return phase.days;
        [nextDays[dayIndex], nextDays[target]] = [nextDays[target], nextDays[dayIndex]];
        return nextDays;
      })(),
    }),
  }));

  const addItem = (phaseIndex: number, dayIndex: number) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : {
      ...phase,
      days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : { ...day, items: [...day.items, emptyItem()] }),
    }),
  }));

  const removeItem = (phaseIndex: number, dayIndex: number, itemIndex: number) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : {
      ...phase,
      days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : {
        ...day,
        items: day.items.filter((_, index) => index !== itemIndex).length ? day.items.filter((_, index) => index !== itemIndex) : [emptyItem()],
      }),
    }),
  }));

  const moveItem = (phaseIndex: number, dayIndex: number, itemIndex: number, direction: -1 | 1) => setPlan((current) => ({
    ...current,
    phases: current.phases.map((phase, phasePos) => phasePos !== phaseIndex ? phase : {
      ...phase,
      days: phase.days.map((day, dayPos) => dayPos !== dayIndex ? day : {
        ...day,
        items: (() => {
          const nextItems = [...day.items];
          const target = itemIndex + direction;
          if (target < 0 || target >= nextItems.length) return day.items;
          [nextItems[itemIndex], nextItems[target]] = [nextItems[target], nextItems[itemIndex]];
          return nextItems;
        })(),
      }),
    }),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newPath = await apiFetch<{ id: string; title: string }>('/paths', {
        method: 'POST',
        body: { title: title.trim(), description: description.trim() || undefined, tags },
      });

      await apiFetch(`/paths/${newPath.id}/plan`, {
        method: 'PUT',
        body: { phases: plan.phases },
      });

      router.push(`/paths/${newPath.id}/settings`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-path-form">
      <div className="form-header">
        <div>
          <p className="eyebrow">Create Learning Path</p>
          <h2>Build a new learning journey</h2>
        </div>
      </div>

      <section className="settings-section">
        <div className="section-title">
          <p className="section-kicker">Details</p>
          <h3>Path overview</h3>
        </div>

        <div className="metadata-grid">
          <label htmlFor="cp-title">Title <span className="required">*</span>
            <input
              id="cp-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Solutions Architect"
              required
              autoFocus
              maxLength={120}
            />
          </label>
        </div>

        <label htmlFor="cp-desc">Description
          <textarea
            id="cp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will learners achieve?"
            rows={3}
            maxLength={500}
          />
        </label>

        <label htmlFor="cp-tags">Tags <span className="hint">(comma-separated)</span>
          <input
            id="cp-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="aws, cloud, certification"
          />
        </label>
      </section>

      <section className="settings-section plan-editor">
        <div className="section-header">
          <div>
            <p className="section-kicker">Curriculum</p>
            <h3>Learning plan structure</h3>
          </div>
          <button type="button" className="button-secondary" onClick={addPhase}>+ Add phase</button>
        </div>

        {plan.phases.map((phase, phaseIndex) => (
          <div className="phase-card" key={`phase-${phaseIndex}`}>
            <div className="phase-header">
              <h4>Phase {phaseIndex + 1}</h4>
              <div className="inline-actions">
                <button type="button" className="button-secondary" onClick={() => movePhase(phaseIndex, -1)} disabled={phaseIndex === 0}>↑</button>
                <button type="button" className="button-secondary" onClick={() => movePhase(phaseIndex, 1)} disabled={phaseIndex === plan.phases.length - 1}>↓</button>
                <button type="button" className="button-secondary" onClick={() => removePhase(phaseIndex)}>Remove</button>
              </div>
            </div>

            <label>
              Phase title
              <input value={phase.title} onChange={(e) => updatePhase(phaseIndex, 'title', e.target.value)} placeholder="Foundations" />
            </label>

            <label>
              Phase goal
              <textarea value={phase.goal} onChange={(e) => updatePhase(phaseIndex, 'goal', e.target.value)} placeholder="What should learners accomplish in this phase?" rows={2} />
            </label>

            {phase.days.map((day, dayIndex) => (
              <div className="day-card" key={`phase-${phaseIndex}-day-${dayIndex}`}>
                <div className="day-header">
                  <h5>Day {dayIndex + 1}</h5>
                  <div className="inline-actions">
                    <button type="button" className="button-secondary" onClick={() => moveDay(phaseIndex, dayIndex, -1)} disabled={dayIndex === 0}>↑</button>
                    <button type="button" className="button-secondary" onClick={() => moveDay(phaseIndex, dayIndex, 1)} disabled={dayIndex === phase.days.length - 1}>↓</button>
                    <button type="button" className="button-secondary" onClick={() => removeDay(phaseIndex, dayIndex)}>Remove day</button>
                  </div>
                </div>

                <div className="row-grid">
                  <label>Day label
                    <input value={day.dayLabel} onChange={(e) => updateDay(phaseIndex, dayIndex, 'dayLabel', e.target.value)} placeholder="Day 1" />
                  </label>
                  <label>Day title
                    <input value={day.title} onChange={(e) => updateDay(phaseIndex, dayIndex, 'title', e.target.value)} placeholder="Workshop" />
                  </label>
                  <label>Hours
                    <input value={day.hours} onChange={(e) => updateDay(phaseIndex, dayIndex, 'hours', e.target.value)} placeholder="2" />
                  </label>
                </div>

                <div className="items-section">
                  <div className="items-header">
                    <h6>Lesson items</h6>
                    <button type="button" className="button-secondary" onClick={() => addItem(phaseIndex, dayIndex)}>+ Add item</button>
                  </div>

                  {day.items.map((item, itemIndex) => (
                    <div className="item-card" key={`phase-${phaseIndex}-day-${dayIndex}-item-${itemIndex}`}>
                      <div className="inline-actions">
                        <button type="button" className="button-secondary" onClick={() => moveItem(phaseIndex, dayIndex, itemIndex, -1)} disabled={itemIndex === 0}>↑</button>
                        <button type="button" className="button-secondary" onClick={() => moveItem(phaseIndex, dayIndex, itemIndex, 1)} disabled={itemIndex === day.items.length - 1}>↓</button>
                        <button type="button" className="button-secondary" onClick={() => removeItem(phaseIndex, dayIndex, itemIndex)}>Remove</button>
                      </div>

                      <div className="row-grid item-grid">
                        <label>Title
                          <input value={item.title} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'title', e.target.value)} placeholder="Read chapter" />
                        </label>
                        <label>URL
                          <input value={item.url} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'url', e.target.value)} placeholder="https://" />
                        </label>
                        <label>Type
                          <select value={item.tag || 'hands'} onChange={(e) => updateItem(phaseIndex, dayIndex, itemIndex, 'tag', e.target.value)}>
                            <option value="hands">Hands-on</option>
                            <option value="exam">Exam</option>
                          </select>
                        </label>
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

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create path'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>

      <style jsx>{`
        .create-path-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          width: 100%;
          max-width: 760px;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .eyebrow, .section-kicker {
          margin: 0 0 .5rem;
          color: var(--accent-primary);
          font-size: .75rem;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .form-header h2, .section-title h3, .section-header h3 {
          margin: 0;
          font-size: 1.35rem;
        }
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          padding: 1.25rem;
        }
        .metadata-grid, .row-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .create-path-form label {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .create-path-form input,
        .create-path-form textarea,
        .create-path-form select {
          width: 100%;
          box-sizing: border-box;
        }
        .required { color: var(--accent-danger); }
        .hint { font-weight: 400; font-size: 0.8rem; }
        .plan-editor { gap: 1rem; }
        .section-header, .phase-header, .day-header, .items-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .phase-card, .day-card, .item-card {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }
        .phase-card {
          margin-top: 0.25rem;
        }
        .inline-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .items-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .item-card {
          padding: 0.75rem;
        }
        .form-error {
          color: var(--accent-danger);
          font-size: 0.875rem;
          margin: 0;
        }
        .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        @media (max-width: 700px) {
          .create-path-form {
            padding: 1.25rem;
          }
          .form-actions {
            flex-direction: column;
          }
          .form-actions > * {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
