'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';

interface AccountPath {
  pathId: string;
  role: 'admin' | 'moderator' | 'learner';
  path: { id: string; title: string; description: string | null; created_by: string } | null;
}

interface AccountData {
  identity: { displayName: string; avatarUrl: string | null; email: string | null };
  isPlatformAdmin: boolean;
  memberships: AccountPath[];
  creator: { usage: number; maxCreatedPaths: number; remaining: number };
}

interface QuotaRequest {
  id: string;
  current_limit: number;
  requested_limit: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map((part) => part[0]?.toUpperCase() ?? '').join('') : 'L';
}

export default function AccountDashboard() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [requests, setRequests] = useState<QuotaRequest[]>([]);
  const [requestedLimit, setRequestedLimit] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingRequest, setSavingRequest] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [accountData, requestData] = await Promise.all([
        apiFetch<AccountData>('/account'),
        apiFetch<QuotaRequest[]>('/quota-requests'),
      ]);
      setAccount(accountData);
      setAvatarFailed(false);
      setRequests(requestData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(task);
  }, []);

  const admins = useMemo(() => account?.memberships.filter((membership) => membership.role === 'admin') ?? [], [account]);
  const participants = useMemo(() => account?.memberships.filter((membership) => membership.role !== 'admin') ?? [], [account]);
  const hasPendingRequest = requests.some((request) => request.status === 'pending');

  const requestQuota = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingRequest(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/quota-requests', { method: 'POST', body: { requested_limit: Number(requestedLimit), reason } });
      setRequestedLimit('');
      setReason('');
      setShowRequestForm(false);
      setMessage('Quota increase request submitted for Platform Admin review.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit quota request');
    } finally {
      setSavingRequest(false);
    }
  };

  const deletePath = async (pathId: string, title: string) => {
    const confirmed = window.confirm(`Delete "${title}" permanently? This removes the Learning Path and its dependent path data. This action cannot be undone.`);
    if (!confirmed) return;
    setError('');
    try {
      await apiFetch(`/paths/${pathId}`, { method: 'DELETE' });
      setMessage(`${title} was deleted and your creator capacity was restored.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete path');
    }
  };

  if (loading) return <MultilingualLoader message="Preparing your account" />;
  if (error && !account) return <main className="account-page"><div className="state-block error-state"><h1>Account unavailable</h1><p>{error}</p><button className="button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div></main>;
  if (!account) return null;

  return (
    <main className="account-page">
      <header className="account-header"><div><p className="eyebrow">Manage account</p><h1>Your ODU identity and access</h1><p>Understand how you participate, what you lead, and how much creator capacity you have available.</p></div><Link className="button-secondary" href="/profile">Edit Profile</Link></header>
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}

      <section className="identity-panel" aria-labelledby="identity-heading">
        <div className="account-avatar">{account.identity.avatarUrl && !avatarFailed ? <img src={account.identity.avatarUrl} alt="" onError={() => setAvatarFailed(true)} /> : getInitials(account.identity.displayName)}</div>
        <div><p className="section-kicker">Identity</p><h2 id="identity-heading">{account.identity.displayName}</h2><p>{account.identity.email}</p><Link className="text-link" href="/profile">Manage profile details</Link></div>
      </section>

      <section className="account-section" aria-labelledby="roles-heading"><div className="section-heading"><div><p className="section-kicker">Role visibility</p><h2 id="roles-heading">Roles & permissions</h2></div></div>
        {account.isPlatformAdmin && <div className="platform-role"><strong>Platform Admin</strong><span>Platform-level publication and protected administration.</span></div>}
        {(['admin', 'moderator', 'learner'] as const).map((role) => {
          const roleMemberships = account.memberships.filter((membership) => membership.role === role);
          const permissions = role === 'admin' ? 'Manage path settings, edit curriculum, manage members, and delete the path you administer.' : role === 'moderator' ? 'Approve or reject membership requests and perform the moderator-level actions available for that path.' : 'Access learning content, track personal progress, and add Personal Notes.';
          return <div className="role-row" key={role}><div><h3>{role === 'admin' ? 'Admin / Space Creator' : role.charAt(0).toUpperCase() + role.slice(1)}</h3><p>{permissions}</p></div><div className="role-paths">{roleMemberships.length ? roleMemberships.map((membership) => <span key={membership.pathId}>{membership.path?.title ?? 'Learning Path'}</span>) : <small>None currently</small>}</div></div>;
        })}
      </section>

      <section className="account-section" aria-labelledby="lead-heading"><div className="section-heading"><div><p className="section-kicker">Lead a Learning Journey</p><h2 id="lead-heading">Learning Paths I Lead</h2></div><span>{admins.length} path{admins.length === 1 ? '' : 's'}</span></div>
        {admins.length ? <div className="account-path-grid">{admins.map((membership) => membership.path && <article className="account-path-card" key={membership.pathId}><div><span className="role-label">Admin / Space Creator</span><h3>{membership.path.title}</h3><p>{membership.path.description || 'Build and guide a structured Learning Path for your community.'}</p></div><div className="card-actions"><Link className="button-primary" href={`/paths/${membership.path.id}/settings`}>Manage</Link><button className="button-secondary danger-button" type="button" onClick={() => deletePath(membership.pathId, membership.path?.title ?? 'Learning Path')}>Delete</button></div></article>)}</div> : <div className="empty-block"><p>You do not lead a Learning Path yet.</p><Link className="button-primary" href="/paths">Create a Learning Path</Link></div>}
      </section>

      <section className="account-section" aria-labelledby="participate-heading"><div className="section-heading"><div><p className="section-kicker">Join a Learning Journey</p><h2 id="participate-heading">Learning Paths I Participate In</h2></div><span>{participants.length} path{participants.length === 1 ? '' : 's'}</span></div>
        {participants.length ? <div className="account-path-grid">{participants.map((membership) => membership.path && <article className="account-path-card" key={membership.pathId}><div><span className="role-label">{membership.role === 'moderator' ? 'Moderator' : 'Learner'}</span><h3>{membership.path.title}</h3><p>{membership.path.description || 'Continue learning with the community.'}</p></div><Link className="button-primary" href={`/paths/${membership.path.id}`}>Open / Continue</Link></article>)}</div> : <div className="empty-block"><p>You are not participating in another Learning Path yet.</p><Link className="button-secondary" href="/explore">Explore Learning Paths</Link></div>}
      </section>

      <section className="account-section quota-section" aria-labelledby="quota-heading"><div className="section-heading"><div><p className="section-kicker">Creator capacity</p><h2 id="quota-heading">Learning Path quota</h2></div></div><div className="quota-summary"><strong>{account.creator.usage} of {account.creator.maxCreatedPaths} Learning Paths used</strong><span>{account.creator.remaining} remaining</span></div><div className="quota-actions">{account.creator.remaining > 0 ? <Link className="button-primary" href="/paths">Create a Learning Path</Link> : <span className="limit-message">Your creator limit is full.</span>}{!hasPendingRequest && <button className="button-secondary" type="button" onClick={() => { setRequestedLimit(String(account.creator.maxCreatedPaths + 1)); setShowRequestForm(true); }}>Request a higher limit</button>}</div>{hasPendingRequest && <p className="pending-message">Your quota increase request is awaiting Platform Admin review.</p>}{!hasPendingRequest && showRequestForm && <form className="quota-form" onSubmit={requestQuota}><label>Requested maximum<input type="number" min={account.creator.maxCreatedPaths + 1} value={requestedLimit} onChange={(event) => setRequestedLimit(event.target.value)} required /></label><label>Reason <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Tell us what you want to build." /></label><div><button className="button-primary" type="submit" disabled={savingRequest}>{savingRequest ? 'Submitting…' : 'Submit request'}</button></div></form>}</section>

      <style jsx>{`
        .account-page{max-width:1080px;margin:0 auto;padding:3.5rem 1.25rem 5rem}.account-header{display:flex;align-items:end;justify-content:space-between;gap:2rem;padding-bottom:2rem;border-bottom:1px solid var(--border-color)}.eyebrow,.section-kicker{margin:0 0 .55rem;color:var(--accent-primary);font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.account-header h1{margin:0;font-size:clamp(2.2rem,5vw,3.7rem)}.account-header p:not(.eyebrow){max-width:680px;margin:1rem 0 0;color:var(--text-secondary)}.identity-panel{display:flex;align-items:center;gap:1rem;margin:2rem 0 3rem;padding:1.35rem;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary)}.account-avatar{width:4rem;height:4rem;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;background:var(--accent-secondary);color:#fff;font-size:1.2rem;font-weight:800}.account-avatar img{width:100%;height:100%;object-fit:cover}.identity-panel h2{margin:0;font-size:1.4rem}.identity-panel p:not(.section-kicker){margin:.3rem 0;color:var(--text-secondary)}.text-link{color:var(--accent-primary);font-size:.88rem;font-weight:700}.account-section{margin-top:3rem}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:1rem}.section-heading h2{margin:0;font-size:1.65rem}.section-heading>span{color:var(--text-secondary);font-size:.85rem}.platform-role,.role-row,.account-path-card,.empty-block,.quota-section{border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary)}.platform-role{display:flex;flex-direction:column;gap:.25rem;padding:1rem;margin-bottom:.75rem}.platform-role strong{color:var(--accent-primary)}.platform-role span,.role-row p,.account-path-card p,.empty-block p,.pending-message{color:var(--text-secondary);font-size:.9rem}.role-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,.7fr);gap:1rem;padding:1rem;margin-top:.65rem}.role-row h3{margin:0;font-size:1rem}.role-row p{margin:.35rem 0 0}.role-paths{display:flex;flex-wrap:wrap;justify-content:flex-end;align-content:flex-start;gap:.4rem}.role-paths span{padding:.35rem .55rem;border-radius:var(--radius-sm);background:var(--bg-tertiary);font-size:.78rem}.role-paths small{color:var(--text-tertiary)}.account-path-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}.account-path-card{display:flex;flex-direction:column;justify-content:space-between;min-height:190px;padding:1.25rem}.account-path-card h3{margin:.35rem 0 0;font-size:1.2rem}.account-path-card p{margin:1rem 0 0}.role-label{color:var(--accent-primary);font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.card-actions{display:flex;gap:.65rem;margin-top:1.25rem}.danger-button{color:var(--accent-danger)}.empty-block{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.25rem}.empty-block p{margin:0}.quota-section{padding:1.25rem}.quota-summary{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}.quota-summary strong{font-size:1.25rem}.quota-summary span{color:var(--accent-secondary);font-weight:800}.quota-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.25rem}.limit-message{display:flex;align-items:center;color:var(--accent-warning);font-weight:700}.quota-form{display:grid;grid-template-columns:180px 1fr;gap:1rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color)}.quota-form label{display:flex;flex-direction:column;gap:.4rem;font-size:.85rem;font-weight:700}.quota-form textarea{resize:vertical}.quota-form>div{grid-column:1/-1}.error-message,.success-message{margin:1rem 0 0}.error-message{color:var(--accent-danger)}.success-message{color:var(--accent-primary)}
        @media(max-width:700px){.account-page{padding:2.5rem 1rem 4rem}.account-header{align-items:flex-start;flex-direction:column}.identity-panel{align-items:flex-start}.role-row{grid-template-columns:1fr}.role-paths{justify-content:flex-start}.empty-block,.quota-summary{align-items:flex-start;flex-direction:column}.quota-form{grid-template-columns:1fr}.quota-form>div{grid-column:auto}}
      `}</style>
    </main>
  );
}
