'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';
import LearningPathCard from '@/components/LearningPathCard';
import CreatePathForm from '@/components/CreatePathForm';

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

interface ProgressData {
  completedItemIds: string[];
}

interface PlanData {
  phases: { days: { items: { id: string }[] }[] }[];
}

interface JourneyPath extends PathRow {
  completed: number;
  total: number;
}

export default function JourneyDashboard() {
  const [paths, setPaths] = useState<JourneyPath[]>([]);
  const [pending, setPending] = useState<PathRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const createCloseRef = useRef<HTMLButtonElement>(null);
  const createOpenerRef = useRef<HTMLButtonElement | null>(null);

  const openCreate = (event: MouseEvent<HTMLButtonElement>) => {
    createOpenerRef.current = event.currentTarget;
    setShowCreate(true);
  };

  const closeCreate = () => setShowCreate(false);

  useEffect(() => {
    const dialog = createDialogRef.current;
    if (showCreate && dialog && !dialog.open) {
      dialog.showModal();
      createCloseRef.current?.focus();
    } else if (!showCreate && dialog?.open) {
      dialog.close();
    }
  }, [showCreate]);

  const handleCreateDialogClose = () => {
    setShowCreate(false);
    window.requestAnimationFrame(() => createOpenerRef.current?.focus());
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/auth');
          return;
        }

        const { data, error: membershipError } = await supabase
          .from('path_memberships')
          .select('path_id, role, status, learning_paths(id, title, description, visibility)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (membershipError) throw membershipError;

        const rows = (data ?? []) as PathRow[];
        const approved = rows.filter((row) => row.status === 'approved' && row.learning_paths);

        const summaries = await Promise.all(
          approved.map(async (row) => {
            try {
              const [progress, plan] = await Promise.all([
                apiFetch<ProgressData>(`/paths/${row.path_id}/progress`),
                apiFetch<PlanData>(`/paths/${row.path_id}/plan`),
              ]);

              const completed = progress.completedItemIds.length;
              const total = plan.phases.reduce(
                (phaseTotal, phase) => phaseTotal + phase.days.reduce((dayTotal, day) => dayTotal + day.items.length, 0),
                0,
              );

              return { ...row, completed, total };
            } catch {
              return { ...row, completed: 0, total: 0 };
            }
          }),
        );

        if (active) {
          setPaths(summaries);
          setPending(rows.filter((row) => row.status === 'pending'));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load your Journey');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [router]);

  if (loading) return <MultilingualLoader message="Preparing your learning journey" />;
  if (error) {
    return (
      <main className="journey-page">
        <div className="state-block error-state">
          <h1>Your Journey is unavailable</h1>
          <p>{error}</p>
          <button className="button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }

  const totalCompleted = paths.reduce((sum, path) => sum + path.completed, 0);

  return (
    <main className="journey-page">
      <header className="journey-header">
        <div>
          <h1 id="journey-heading" className="heading-gradient-hover">My Journey</h1>
          <p>Return here to continue learning, track progress, and take the next useful action in your Learning Paths.</p>
        </div>
        <div className="header-actions">
          <Link className="button-secondary" href="/explore">Find a Learning Path</Link>
          <button type="button" className="button-primary" onClick={openCreate}>
            Create a Learning Path
          </button>
        </div>
      </header>

      <dialog
        ref={createDialogRef}
        className="create-path-dialog"
        aria-labelledby="create-path-dialog-title"
        aria-describedby="create-path-dialog-intro"
        onCancel={(event) => {
          event.preventDefault();
          closeCreate();
        }}
        onClose={handleCreateDialogClose}
      >
        <header className="create-path-dialog-header">
          <div>
            <h2 id="create-path-dialog-title">Create a Learning Path</h2>
            <p id="create-path-dialog-intro">Shape a clear learning journey for yourself or your community.</p>
            <Link
              className="create-path-help"
              href="/docs/create-a-learning-space#create-your-path-5"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="How to create a Learning Path (opens in a new tab)"
            >
              How to create a Learning Path <span aria-hidden="true">↗</span>
              <span className="new-tab-note">Opens in a new tab</span>
            </Link>
          </div>
          <button
            ref={createCloseRef}
            type="button"
            className="button-secondary create-path-close"
            onClick={closeCreate}
          >
            Close
          </button>
        </header>
        <div className="create-path-dialog-scroll">
          <CreatePathForm onCancel={closeCreate} />
        </div>
      </dialog>

      <section className="journey-overview" aria-label="Journey overview">
        <div>
          <span className="overview-label">Active Learning Paths</span>
          <strong>{paths.length}</strong>
        </div>
        <div>
          <span className="overview-label">Lessons completed</span>
          <strong>{totalCompleted}</strong>
        </div>
        <div>
          <span className="overview-label">Pending requests</span>
          <strong>{pending.length}</strong>
        </div>
      </section>

      {paths.length > 0 ? (
        <section aria-labelledby="active-paths-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Your learning</p>
              <h2 id="active-paths-heading">Active Learning Paths</h2>
            </div>
          </div>
          <div className="journey-grid">
            {paths.map((path) => {
              const lp = path.learning_paths;
              if (!lp) return null;

              return (
                <LearningPathCard
                  key={path.path_id}
                  href={`/paths/${lp.id}`}
                  contextLabel={path.role === 'admin' ? 'Space Creator' : path.role === 'moderator' ? 'Moderator' : 'Learner'}
                  title={lp.title}
                  description={lp.description || 'Continue your structured learning path with the community.'}
                  topMeta={`${path.completed} of ${path.total || 0} complete`}
                  progress={
                    <div className="progress-track" aria-label={`${path.completed} lessons completed`}>
                      <span style={{ width: `${path.total ? Math.min(100, Math.round((path.completed / path.total) * 100)) : 0}%` }} />
                    </div>
                  }
                  secondaryAction={path.role === 'admin' ? <Link className="text-link" href={`/paths/${lp.id}/settings`}>Manage</Link> : undefined}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <section className="empty-journey" aria-labelledby="empty-journey-heading">
          <p className="section-kicker">Your Journey begins here</p>
          <h2 id="empty-journey-heading">Explore a Learning Path or create one.</h2>
          <p>Your next useful step begins when you join a path or create a Learning Path for your own community.</p>
          <div className="empty-journey-actions">
            <Link className="button-primary" href="/explore">Explore Learning Paths</Link>
            <button type="button" className="button-secondary" onClick={openCreate}>Create a Learning Path</button>
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="pending-section" aria-labelledby="pending-heading">
          <p className="section-kicker">Awaiting review</p>
          <h2 id="pending-heading">Pending membership requests</h2>
          {pending.map((path) => (
            <div className="pending-row" key={path.path_id}>
              <strong>{path.learning_paths?.title || 'Learning Path'}</strong>
              <span>{path.role === 'admin' ? 'Space Creator request' : 'Waiting for approval'}</span>
            </div>
          ))}
        </section>
      )}

      <style jsx>{`
        .journey-page { max-width: 1160px; margin: 0 auto; padding: 3.5rem 1.25rem 5rem; }
        .journey-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--surface-card); box-shadow: var(--shadow-sm); }
        .journey-header h1 { max-width: 680px; margin: 0; font-size: 2.8rem; line-height: 1.05; letter-spacing: 0; transition: color 180ms ease; }
        .journey-header p { max-width: 640px; margin: 1rem 0 0; color: var(--text-secondary); font-size: 1.05rem; }
        .header-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .header-actions > * { white-space: nowrap; }
        .eyebrow, .section-kicker { margin: 0 0 .6rem; color: var(--accent-primary); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .create-path-dialog { position: fixed; inset: 0; width: min(calc(100vw - 3rem), 1160px); max-width: calc(100vw - 3rem); height: min(calc(100dvh - 3rem), 900px); max-height: calc(100dvh - 3rem); margin: auto; padding: 0; overflow: hidden; color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); }
        .create-path-dialog[open] { display: grid; grid-template-rows: auto minmax(0, 1fr); }
        .create-path-dialog::backdrop { background: rgba(8, 8, 15, .66); backdrop-filter: blur(3px); }
        .create-path-dialog-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; padding: 1.4rem 1.6rem; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); }
        .create-path-dialog-header h2 { margin: 0; font-size: 1.5rem; line-height: 1.2; }
        .create-path-dialog-header p { margin: .45rem 0 .65rem; color: var(--text-secondary); }
        .create-path-help { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: .3rem; font-size: .88rem; font-weight: 700; }
        .new-tab-note { color: var(--text-secondary); font-size: .78rem; font-weight: 500; }
        .create-path-close { flex: 0 0 auto; }
        .create-path-dialog-scroll { min-width: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; padding: 1.5rem; }
        .journey-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 2rem 0 3rem; border: 1px solid var(--border-color); background: var(--border-color); }
        .journey-overview > div { display: flex; flex-direction: column; gap: .4rem; padding: 1.1rem; background: var(--bg-secondary); }
        .overview-label { color: var(--text-secondary); font-size: .8rem; }
        .journey-overview strong { font-size: 1.8rem; }
        .section-heading { margin-bottom: 1.2rem; }
        .section-heading h2, .empty-journey h2, .pending-section h2 { margin: 0; font-size: 1.7rem; }
        .journey-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .empty-journey { display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; padding: 2.5rem 0 0; }
        .empty-journey p:not(.section-kicker) { margin: 0; max-width: 560px; color: var(--text-secondary); }
        .empty-journey-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .25rem; }
        .progress-track { height: 7px; overflow: hidden; background: var(--bg-tertiary); }
        .progress-track span { display: block; height: 100%; background: var(--accent-secondary); transition: width .2s ease; }
        .pending-section { margin-top: 3rem; }
        .pending-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 0.8rem; padding: 0.9rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); }
        .pending-row span { color: var(--text-secondary); font-size: 0.9rem; }
        @media (max-width: 700px) { .journey-page { padding: 2.5rem 1rem 4rem; } .journey-header { align-items: flex-start; flex-direction: column; padding: 1rem; } .journey-header h1 { font-size: 2.25rem; } .header-actions { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr); } .header-actions > * { min-width: 0; width: 100%; white-space: normal; } .journey-overview { grid-template-columns: 1fr; } .pending-row { align-items: flex-start; flex-direction: column; gap: .25rem; } .empty-journey-actions { width: 100%; flex-direction: column; } .empty-journey-actions > * { width: 100%; } .create-path-dialog { width: calc(100vw - 1rem); max-width: calc(100vw - 1rem); height: calc(100dvh - 1rem); max-height: calc(100dvh - 1rem); border-radius: var(--radius-md); } .create-path-dialog-header { gap: .75rem; padding: 1rem; } .create-path-dialog-header h2 { font-size: 1.25rem; } .create-path-dialog-header p { font-size: .9rem; } .create-path-dialog-scroll { padding: 1rem; } .create-path-close { padding: .6rem .75rem; } }
      `}</style>
    </main>
  );
}
