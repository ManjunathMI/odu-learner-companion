'use client';

import Link from 'next/link';

const sections = [
  { href: '/docs/business-guide', title: 'Business guide', description: 'Product behavior, user roles, and common workflows.' },
  { href: '/docs/architecture', title: 'Architecture', description: 'Tenant boundaries, authentication, authorization, and mobile compatibility.' },
  { href: '/docs/development', title: 'Development guide', description: 'Local setup, environment variables, database setup, and contribution workflow.' },
  { href: '/docs/api', title: 'API reference', description: 'Path-scoped endpoints and request and response contracts.' },
];

export default function DocsPage() {
  return <main className="docs-home">
    <p className="eyebrow">ODU Learner Companion</p>
    <h1>Documentation</h1>
    <p className="intro">A practical guide to the product, architecture, development workflow, and APIs.</p>
    <div className="docs-grid">{sections.map((section) => <Link className="docs-card" href={section.href} key={section.href}><h2>{section.title}</h2><p>{section.description}</p><span>Read document →</span></Link>)}</div>
    <Link href="/" className="back">← Back to public wall</Link>
    <style jsx>{`.docs-home{max-width:1000px;margin:0 auto;padding:3rem 1rem}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:700;color:var(--accent-primary)}h1{font-size:clamp(2rem,5vw,3.5rem);margin:.25rem 0}.intro{color:var(--text-secondary);font-size:1.1rem;margin-bottom:2rem}.docs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.docs-card{display:flex;flex-direction:column;gap:.6rem;padding:1.5rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);text-decoration:none;color:inherit;min-height:170px}.docs-card:hover{border-color:var(--accent-primary);box-shadow:var(--shadow-md)}.docs-card h2{margin:0;font-size:1.2rem}.docs-card p{margin:0;color:var(--text-secondary);flex:1}.docs-card span,.back{color:var(--accent-primary);font-size:.9rem}.back{display:inline-block;margin-top:2rem}`}</style>
  </main>;
}
