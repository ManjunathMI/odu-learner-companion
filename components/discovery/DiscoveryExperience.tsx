'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MultilingualLoader from '@/components/MultilingualLoader';
import LearningPathCard from '@/components/LearningPathCard';

interface WallPath {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  memberCount: number;
  createdAt: string;
}

export default function DiscoveryExperience({ homepage = false }: { homepage?: boolean }) {
  const [paths, setPaths] = useState<WallPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    fetch('/api/wall')
      .then(async (response) => {
        const data = await response.json() as WallPath[] | { error?: string };
        if (!response.ok) throw new Error(('error' in data && data.error) || `HTTP ${response.status}`);
        return data as WallPath[];
      })
      .then(setPaths)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load learning paths'))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => [...new Set(paths.flatMap((path) => path.tags || []))].sort(), [paths]);
  const filteredPaths = useMemo(() => paths.filter((path) => {
    const searchableText = `${path.title} ${path.description || ''} ${(path.tags || []).join(' ')}`.toLowerCase();
    return searchableText.includes(query.trim().toLowerCase()) && (!selectedTag || path.tags?.includes(selectedTag));
  }), [paths, query, selectedTag]);

  if (loading) return <MultilingualLoader message="Finding public learning paths" />;

  return (
    <main className="discovery-page">
      <section className="discovery-hero" aria-labelledby="discovery-heading">
        <div className="hero-copy">
          <p className="eyebrow">ODU Learner Companion</p>
          <h1 id="discovery-heading">Learn anything. Together.</h1>
          <p className="hero-intro">Find a clear path, learn with people who share your goal, and keep your next useful step in view.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#learning-paths">Explore learning paths</a>
            <Link className="button-secondary" href="/start-learning">Start learning</Link>
          </div>
        </div>
        <div className="hero-note">
          <span className="note-mark" aria-hidden="true">01</span>
          <div><strong>Direction, with company</strong><p>Structured practice feels more possible when you do not have to learn alone.</p></div>
        </div>
      </section>

      {homepage && <section className="principles" aria-labelledby="principles-heading">
        <div><p className="section-kicker">A better way to begin</p><h2 id="principles-heading">Choose a goal. Keep moving.</h2></div>
        <p>ODU brings discovery, a practical learning plan, personal progress, and a learning community into one calm place.</p>
      </section>}

      <section className="path-section" id="learning-paths" aria-labelledby="paths-heading">
        <div className="section-heading"><div><p className="section-kicker">Explore</p><h2 id="paths-heading">Public Learning Paths</h2></div><span className="path-count">{filteredPaths.length} of {paths.length}</span></div>
        <div className="discovery-controls">
          <label className="search-field"><span>What do you want to learn?</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic or skill" /></label>
          {tags.length > 0 && <div className="tag-filter" aria-label="Filter paths by topic"><button type="button" className={!selectedTag ? 'active' : ''} onClick={() => setSelectedTag('')}>All topics</button>{tags.map((tag) => <button type="button" className={selectedTag === tag ? 'active' : ''} onClick={() => setSelectedTag(tag)} key={tag}>{tag}</button>)}</div>}
        </div>
        {error ? <div className="state-block error-state"><h3>Learning paths are unavailable</h3><p>{error}</p><button className="button-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div> : <div className="path-grid">
          {filteredPaths.map((path) => <LearningPathCard
            key={path.id}
            href={`/paths/${path.id}`}
            contextLabel="PUBLIC LEARNING PATH"
            title={path.title}
            description={path.description || 'A structured learning path shared by the community.'}
            topMeta={`${path.memberCount} member${path.memberCount === 1 ? '' : 's'}`}
            tags={path.tags?.length ? path.tags.join(' · ') : 'Community path'}
          />)}
          {!paths.length && <div className="state-block"><h3>New paths will appear here</h3><p>There are no approved public Learning Paths to explore yet.</p></div>}
          {paths.length > 0 && !filteredPaths.length && <div className="state-block"><h3>No paths match this search</h3><p>Try another topic or clear the filters.</p><button type="button" className="button-secondary" onClick={() => { setQuery(''); setSelectedTag(''); }}>Clear filters</button></div>}
        </div>}
      </section>

      {homepage && <section className="planned-section" aria-labelledby="planned-heading"><div><p className="section-kicker">Coming later</p><h2 id="planned-heading">An AI Companion that supports your learning</h2></div><p>Planned assistance may help explain topics, practice with questions, and suggest next steps. Your learning plan always stays in your hands.</p></section>}

      <style jsx>{`
        .discovery-page{max-width:1160px;margin:0 auto;padding:3.5rem 1.25rem 5rem}.discovery-hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(230px,.75fr);gap:3rem;align-items:end;padding:2rem 0 4rem;border-bottom:1px solid var(--border-color)}.eyebrow,.section-kicker{margin:0 0 .65rem;color:var(--accent-primary);font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.discovery-hero h1{max-width:720px;margin:0;font-size:clamp(2.8rem,7vw,5.5rem);line-height:.98;letter-spacing:-.04em}.hero-intro{max-width:650px;margin:1.5rem 0 0;color:var(--text-secondary);font-size:1.15rem}.hero-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.75rem}.hero-note{display:flex;gap:1rem;align-items:flex-start;border-top:3px solid var(--accent-secondary);padding-top:1rem;color:var(--text-secondary)}.hero-note strong{display:block;color:var(--text-primary);font-size:1.05rem}.hero-note p{margin:.4rem 0 0;font-size:.9rem}.note-mark{color:var(--accent-secondary);font-size:.8rem;font-weight:800;letter-spacing:.08em}.principles,.planned-section{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:2rem;padding:3rem 0;border-bottom:1px solid var(--border-color)}.principles h2,.planned-section h2{margin:0;font-size:1.8rem}.principles>p,.planned-section>p{margin:0;color:var(--text-secondary);font-size:1.02rem}.path-section{padding-top:3rem}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1.25rem}.section-heading h2{margin:0;font-size:1.65rem}.path-count{color:var(--text-secondary);font-size:.85rem;white-space:nowrap}.discovery-controls{display:grid;grid-template-columns:minmax(230px,330px) 1fr;gap:1rem;align-items:end;margin-bottom:1.5rem}.search-field{display:flex;flex-direction:column;gap:.4rem;color:var(--text-secondary);font-size:.78rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.search-field input{width:100%;font-size:.95rem;font-weight:400;letter-spacing:0;text-transform:none}.tag-filter{display:flex;flex-wrap:wrap;gap:.4rem}.tag-filter button{padding:.48rem .68rem;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:transparent;color:var(--text-secondary);font-size:.8rem;font-weight:700}.tag-filter button:hover,.tag-filter button.active{border-color:var(--accent-primary);background:var(--bg-tertiary);color:var(--accent-primary)}.path-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:1rem}.path-card{display:flex;min-height:205px;flex-direction:column;padding:1.4rem;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary);color:inherit;text-decoration:none;transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease}.path-card:hover{border-color:var(--accent-primary);box-shadow:var(--shadow-md);text-decoration:none;transform:translateY(-2px)}.card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.card-top h3{margin:0;font-size:1.1rem}.card-link{color:var(--accent-primary);font-size:.8rem;font-weight:700;white-space:nowrap}.path-card>p{flex:1;margin:.85rem 0;color:var(--text-secondary);font-size:.92rem}.card-footer{display:flex;justify-content:space-between;gap:.8rem;padding-top:.9rem;border-top:1px solid var(--border-color);color:var(--text-secondary);font-size:.78rem}.card-footer small{text-align:right}.state-block{grid-column:1 / -1;padding:2.5rem 0;border-top:1px solid var(--border-color);color:var(--text-secondary)}.state-block h3{margin:0 0 .4rem;color:var(--text-primary);font-size:1.05rem}.state-block p{margin:0 0 1rem}.error-state{border-top:3px solid var(--accent-danger)}
        .path-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}
        @media(max-width:760px){.discovery-page{padding:2.5rem 1rem 4rem}.discovery-hero,.principles,.planned-section{grid-template-columns:1fr;gap:1.5rem}.discovery-hero{padding-top:1rem;padding-bottom:3rem}.discovery-hero h1{font-size:3.25rem}.discovery-controls{grid-template-columns:1fr}.section-heading{align-items:flex-start}.card-footer{align-items:flex-start;flex-direction:column}.card-footer small{text-align:left}}
      `}</style>
    </main>
  );
}