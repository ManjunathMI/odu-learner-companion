'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';
import LearningPathCard from '@/components/LearningPathCard';

interface PathRow { path_id: string; role: 'admin' | 'moderator' | 'learner'; status: string; learning_paths: { id: string; title: string; description: string | null; visibility: string } | null; }
interface ProgressData { completedItemIds: string[]; }
interface PlanData { phases: { days: { items: { id: string }[] }[] }[]; }
interface JourneyPath extends PathRow { completed: number; total: number; nextItem?: string; }

export default function JourneyDashboard() {
  const [paths, setPaths] = useState<JourneyPath[]>([]);
  const [pending, setPending] = useState<PathRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace('/auth'); return; }
        const { data, error: membershipError } = await supabase.from('path_memberships').select('path_id, role, status, learning_paths(id, title, description, visibility)').eq('user_id', user.id).order('joined_at', { ascending: false });
        if (membershipError) throw membershipError;
        const rows = (data ?? []) as PathRow[];
        const approved = rows.filter((row) => row.status === 'approved' && row.learning_paths);
        const summaries = await Promise.all(approved.map(async (row) => {
          try {
            const [progress, plan] = await Promise.all([
              apiFetch<ProgressData>(`/paths/${row.path_id}/progress`),
              apiFetch<PlanData>(`/paths/${row.path_id}/plan`),
            ]);
            const completed = progress.completedItemIds.length;
            const total = plan.phases.reduce((phaseTotal, phase) => phaseTotal + phase.days.reduce((dayTotal, day) => dayTotal + day.items.length, 0), 0);
            return { ...row, completed, total };
          } catch {
            return { ...row, completed: 0, total: 0 };
          }
        }));
        if (active) { setPaths(summaries); setPending(rows.filter((row) => row.status === 'pending')); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load your Journey');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [router]);

  if (loading) return <MultilingualLoader message="Preparing your learning journey" />;
  if (error) return <main className="journey-page"><div className="state-block error-state"><h1>Your Journey is unavailable</h1><p>{error}</p><button className="button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div></main>;

  const totalCompleted = paths.reduce((sum, path) => sum + path.completed, 0);
  return <main className="journey-page">
    <header className="journey-header"><div><p className="eyebrow">My Journey</p><h1>Keep your learning moving.</h1><p>See what is active, choose your next useful action, and return to the spaces where you learn with others.</p></div><Link className="button-primary" href="/explore">Find a Learning Path</Link></header>
    <section className="journey-overview" aria-label="Journey overview"><div><span className="overview-label">Active spaces</span><strong>{paths.length}</strong></div><div><span className="overview-label">Lessons completed</span><strong>{totalCompleted}</strong></div><div><span className="overview-label">Pending requests</span><strong>{pending.length}</strong></div></section>
    {paths.length > 0 ? <section aria-labelledby="active-spaces-heading"><div className="section-heading"><div><p className="section-kicker">Your current learning</p><h2 id="active-spaces-heading">Active Learning Spaces</h2></div></div><div className="journey-grid">{paths.map((path) => { const lp = path.learning_paths; if (!lp) return null; return <LearningPathCard key={path.path_id} href={`/paths/${lp.id}`} contextLabel={path.role === 'admin' ? 'Space Creator' : path.role === 'moderator' ? 'Moderator' : 'Learner'} title={lp.title} description={lp.description || 'Continue your structured learning path with the community.'} topMeta={`${path.completed} done`} progress={<div className="progress-track" aria-label={`${path.completed} lessons completed`}><span style={{ width: `${path.total ? Math.min(100, Math.round((path.completed / path.total) * 100)) : 0}%` }} /></div>} secondaryAction={path.role === 'admin' ? <Link className="text-link" href={`/paths/${lp.id}/settings`}>Manage</Link> : undefined} />; })}</div></section> : <section className="empty-journey"><p className="section-kicker">A fresh start</p><h2>Choose something worth learning.</h2><p>Your Journey will become the place to see progress, notes, and your next step once you join a Learning Space.</p><Link className="button-primary" href="/explore">Explore public paths</Link></section>}
    {pending.length > 0 && <section className="pending-section" aria-labelledby="pending-heading"><p className="section-kicker">Awaiting review</p><h2 id="pending-heading">Pending membership requests</h2>{pending.map((path) => <div className="pending-row" key={path.path_id}><strong>{path.learning_paths?.title || 'Learning Path'}</strong><span>Waiting for approval</span></div>)}</section>}
    <style jsx>{`
      .journey-page{max-width:1080px;margin:0 auto;padding:3.5rem 1.25rem 5rem}.journey-header{display:flex;align-items:end;justify-content:space-between;gap:2rem;padding-bottom:2.5rem;border-bottom:1px solid var(--border-color)}.eyebrow,.section-kicker{margin:0 0 .6rem;color:var(--accent-primary);font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.journey-header h1{max-width:680px;margin:0;font-size:clamp(2.5rem,5vw,4.2rem);line-height:1}.journey-header p:not(.eyebrow){max-width:640px;margin:1rem 0 0;color:var(--text-secondary);font-size:1.05rem}.journey-overview{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:2rem 0 3rem;border:1px solid var(--border-color);background:var(--border-color)}.journey-overview>div{display:flex;flex-direction:column;gap:.4rem;padding:1.1rem;background:var(--bg-secondary)}.overview-label{color:var(--text-secondary);font-size:.8rem}.journey-overview strong{font-size:1.8rem}.section-heading{margin-bottom:1.2rem}.section-heading h2,.empty-journey h2,.pending-section h2{margin:0;font-size:1.7rem}.journey-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}.journey-card{display:flex;flex-direction:column;padding:1.35rem;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary)}.journey-card-top{display:flex;justify-content:space-between;gap:1rem}.journey-card h3{margin:.35rem 0 0;font-size:1.25rem}.role-label{color:var(--accent-primary);font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.progress-number{color:var(--accent-secondary);font-size:.8rem;font-weight:800;white-space:nowrap}.journey-card>p{flex:1;margin:1rem 0;color:var(--text-secondary);font-size:.92rem}.progress-track{height:7px;overflow:hidden;background:var(--bg-tertiary)}.progress-track span{display:block;height:100%;background:var(--accent-secondary);transition:width .2s ease}.journey-card-footer{display:flex;align-items:center;gap:1rem;margin-top:1.25rem}.text-link{font-size:.85rem;font-weight:700}.empty-journey{padding:3rem 0;border-top:3px solid var(--accent-secondary)}.empty-journey>p:not(.section-kicker){max-width:560px;color:var(--text-secondary)}.empty-journey .button-primary{display:inline-flex;margin-top:.5rem}.pending-section{margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border-color)}.pending-row{display:flex;justify-content:space-between;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--border-color);color:var(--text-secondary)}.pending-row strong{color:var(--text-primary)}.state-block{padding:3rem 0}.error-state{border-top:3px solid var(--accent-danger)}.state-block h1{margin:0 0 .5rem}.state-block p{color:var(--text-secondary)}
      @media(max-width:700px){.journey-page{padding:2.5rem 1rem 4rem}.journey-header{align-items:flex-start;flex-direction:column}.journey-header h1{font-size:3rem}.journey-overview{grid-template-columns:1fr}.pending-row{align-items:flex-start;flex-direction:column;gap:.25rem}}
    `}</style>
  </main>;
}