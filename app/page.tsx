'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface WallPath { id: string; title: string; description: string | null; tags: string[] | null; memberCount: number; createdAt: string; }

export default function WallPage() {
  const [paths, setPaths] = useState<WallPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch<WallPath[]>('/wall').then(setPaths).finally(() => setLoading(false)); }, []);

  return <main className="wall">
    <header className="wall-header"><div><p className="eyebrow">ODU Learner Companion</p><h1>Find your next learning path</h1><p>Browse public paths, join a community, and make steady progress.</p></div><Link className="button-primary" href="/auth">Sign in</Link></header>
    {loading ? <p>Loading public paths…</p> : <section className="wall-grid">
      {paths.map((path) => <Link className="wall-card" href={`/paths/${path.id}`} key={path.id}><h2>{path.title}</h2>{path.description && <p>{path.description}</p>}<span>{path.memberCount} member{path.memberCount === 1 ? '' : 's'}</span>{path.tags?.length ? <small>{path.tags.join(' · ')}</small> : null}</Link>)}
      {!paths.length && <p>No public paths are available yet.</p>}
    </section>}
    <style jsx>{`.wall{max-width:1100px;margin:0 auto;padding:3rem 1rem}.wall-header{display:flex;justify-content:space-between;gap:2rem;align-items:flex-start;margin-bottom:2.5rem}.wall-header h1{font-size:clamp(2rem,5vw,3.5rem);max-width:700px;margin:.25rem 0}.wall-header p{color:var(--text-secondary)}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:700}.wall-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}.wall-card{display:flex;flex-direction:column;gap:.6rem;padding:1.5rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);text-decoration:none;color:inherit}.wall-card:hover{border-color:var(--accent-primary);box-shadow:var(--shadow-md)}.wall-card h2{margin:0;font-size:1.2rem}.wall-card p{margin:0;color:var(--text-secondary);flex:1}.wall-card span,.wall-card small{color:var(--text-secondary);font-size:.8rem}`}</style>
  </main>;
}
