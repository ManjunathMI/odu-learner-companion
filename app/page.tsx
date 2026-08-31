'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';

interface WallPath { id: string; title: string; description: string | null; tags: string[] | null; memberCount: number; createdAt: string; }

export default function WallPage() {
  const [paths, setPaths] = useState<WallPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => { apiFetch<WallPath[]>('/wall').then(setPaths).finally(() => setLoading(false)); }, []);

  const tags = [...new Set(paths.flatMap((path) => path.tags || []))].sort();
  const filteredPaths = paths.filter((path) => {
    const searchableText = `${path.title} ${path.description || ''} ${(path.tags || []).join(' ')}`.toLowerCase();
    return searchableText.includes(query.trim().toLowerCase()) && (!selectedTag || path.tags?.includes(selectedTag));
  });

  if (loading) return <MultilingualLoader message="Finding public learning paths" />;

  return <main className="wall">
    <header className="wall-header">
      <div>
        <p className="eyebrow">ODU Learner Companion</p>
        <h1>Learning, with a clear way forward.</h1>
        <p className="intro">Explore community-led paths, build a steady practice, and see each next step at a glance.</p>
      </div>
      <div className="header-note"><strong>Browse with confidence</strong><span>Join a path when it fits your goal.</span></div>
    </header>
    <section className="wall-section" aria-labelledby="public-paths-heading">
      <div className="section-heading"><div><p className="section-kicker">Explore</p><h2 id="public-paths-heading">Public learning paths</h2></div><span className="path-count">{filteredPaths.length} of {paths.length} available</span></div>
      {paths.length > 0 && <div className="discovery-controls"><label className="search-field"><span>Search paths</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic or skill" /></label>{tags.length > 0 && <div className="tag-filter" aria-label="Filter paths by tag"><button type="button" className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag('')}>All topics</button>{tags.map((tag) => <button type="button" className={selectedTag === tag ? 'active' : ''} onClick={() => setSelectedTag(tag)} key={tag}>{tag}</button>)}</div>}</div>}
      <div className="wall-grid">
        {filteredPaths.map((path) => <Link className="wall-card" href={`/paths/${path.id}`} key={path.id}>
          <div className="card-top"><h3>{path.title}</h3><span className="card-link">View path</span></div>
          <p>{path.description || 'A structured learning path shared by the community.'}</p>
          <div className="card-footer"><span>{path.memberCount} member{path.memberCount === 1 ? '' : 's'}</span>{path.tags?.length ? <small>{path.tags.join(' · ')}</small> : <small>Community path</small>}</div>
        </Link>)}
        {!paths.length && <div className="empty-state"><h3>New paths will appear here</h3><p>There are no approved public paths to explore yet.</p></div>}
        {paths.length > 0 && !filteredPaths.length && <div className="empty-state"><h3>No paths match this search</h3><p>Try a different topic or clear the filters to explore every available path.</p><button type="button" className="button-secondary" onClick={() => { setQuery(''); setSelectedTag(''); }}>Clear filters</button></div>}
      </div>
    </section>
    <style jsx>{`
      .wall{max-width:1120px;margin:0 auto;padding:4.5rem 1.25rem 5rem}
      .wall-header{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:3rem;align-items:end;margin-bottom:4rem;padding-bottom:2.25rem;border-bottom:1px solid var(--border-color)}
      .eyebrow,.section-kicker{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:700;color:var(--accent-primary);margin:0 0 .65rem}
      .wall-header h1{font-size:3.5rem;max-width:720px;margin:0;line-height:1.05}
      .intro{max-width:610px;margin:1.25rem 0 0;color:var(--text-secondary);font-size:1.1rem}
      .header-note{display:flex;flex-direction:column;gap:.35rem;padding:1.1rem 0;border-top:3px solid var(--accent-secondary);color:var(--text-secondary);font-size:.9rem}
      .header-note strong{color:var(--text-primary);font-size:1rem}.wall-section{min-width:0}.section-heading{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:1.25rem}.section-heading h2{margin:0;font-size:1.5rem}.path-count{font-size:.85rem;color:var(--text-secondary);white-space:nowrap}
      .discovery-controls{display:grid;grid-template-columns:minmax(220px,310px) 1fr;gap:1rem;align-items:end;margin:0 0 1.5rem}.search-field{display:flex;flex-direction:column;gap:.35rem;font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary)}.search-field input{width:100%;padding:.6rem .75rem;font-size:.9rem;font-weight:400;letter-spacing:0;text-transform:none}.tag-filter{display:flex;flex-wrap:wrap;gap:.4rem}.tag-filter button{background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);font-size:.8rem;font-weight:700;padding:.48rem .65rem}.tag-filter button:hover,.tag-filter button.active{background:var(--bg-tertiary);border-color:var(--accent-primary);color:var(--accent-primary)}
      .wall-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:1rem}.wall-card{display:flex;flex-direction:column;min-height:200px;padding:1.4rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);text-decoration:none;color:inherit;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}.wall-card:hover{transform:translateY(-2px);border-color:var(--accent-primary);box-shadow:var(--shadow-md);text-decoration:none}.card-top{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.card-top h3{margin:0;font-size:1.1rem}.card-link{font-size:.8rem;font-weight:700;color:var(--accent-primary);white-space:nowrap}.wall-card p{margin:.85rem 0;color:var(--text-secondary);font-size:.92rem;flex:1}.card-footer{display:flex;justify-content:space-between;gap:.8rem;padding-top:.9rem;border-top:1px solid var(--border-color);font-size:.78rem;color:var(--text-secondary)}.card-footer small{font-size:inherit;text-align:right}.loading-state{padding:2rem 0;color:var(--text-secondary)}.empty-state{grid-column:1 / -1;padding:2.5rem 0;border-top:1px solid var(--border-color);color:var(--text-secondary)}.empty-state h3{font-size:1.05rem;margin:0 0 .4rem}.empty-state p{margin:0}
      @media(max-width:720px){.wall{padding:3rem 1rem 4rem}.wall-header{grid-template-columns:1fr;gap:1.5rem;margin-bottom:2.75rem}.wall-header h1{font-size:2.55rem}.header-note{max-width:none}.section-heading{align-items:start}.discovery-controls{grid-template-columns:1fr}.card-footer{align-items:flex-start;flex-direction:column}}
    `}</style>
  </main>;
}
