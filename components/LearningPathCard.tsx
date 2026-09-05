import Link from 'next/link';
import type { ReactNode } from 'react';

interface LearningPathCardProps {
  href: string;
  contextLabel: string;
  title: string;
  description: string;
  topMeta: string;
  tags?: string;
  progress?: ReactNode;
  secondaryAction?: ReactNode;
  ctaLabel?: string;
}

export default function LearningPathCard({
  href,
  contextLabel,
  title,
  description,
  topMeta,
  tags,
  progress,
  secondaryAction,
  ctaLabel = 'OPEN LEARNING SPACE',
}: LearningPathCardProps) {
  return (
    <article className="learning-path-card">
      <header className="learning-path-card-header">
        <div>
          <span className="learning-path-card-context">{contextLabel}</span>
          <h3><Link href={href}>{title}</Link></h3>
        </div>
        <span className="learning-path-card-meta">{topMeta}</span>
      </header>
      <p className="learning-path-card-description">{description}</p>
      {progress}
      <footer className="learning-path-card-footer">
        <div className="learning-path-card-details">
          {tags && <small>{tags}</small>}
          {secondaryAction}
        </div>
        <Link className="button-primary learning-path-card-cta" href={href}>{ctaLabel}</Link>
      </footer>
      <style jsx>{`
        .learning-path-card{display:flex;flex-direction:column;min-height:235px;padding:1.35rem;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-secondary);box-shadow:var(--shadow-sm);transition:box-shadow .15s ease,border-color .15s ease,transform .15s ease}.learning-path-card:hover{border-color:var(--accent-primary);box-shadow:var(--shadow-md);transform:translateY(-1px)}.learning-path-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.learning-path-card-context{color:var(--accent-primary);font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.learning-path-card h3{margin:.35rem 0 0;font-size:1.25rem}.learning-path-card h3 a{color:var(--text-primary)}.learning-path-card h3 a:hover{color:var(--accent-primary)}.learning-path-card-meta{color:var(--accent-secondary);font-size:.8rem;font-weight:800;white-space:nowrap}.learning-path-card-description{flex:1;margin:1rem 0;color:var(--text-secondary);font-size:.92rem}.learning-path-card-footer{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-top:auto;padding-top:.85rem;border-top:1px solid var(--border-color)}.learning-path-card-details{display:flex;flex-direction:column;align-items:flex-start;gap:.45rem;min-width:0}.learning-path-card-details small{overflow-wrap:anywhere;color:var(--text-tertiary);font-size:.78rem}.learning-path-card-cta{flex-shrink:0;white-space:nowrap;text-transform:uppercase}.learning-path-card :global(.progress-track){width:100%;margin-bottom:1rem}.learning-path-card :global(.text-link){font-size:.85rem;font-weight:700}
        @media(max-width:700px){.learning-path-card{min-height:220px}.learning-path-card-header{gap:.75rem}.learning-path-card-footer{align-items:stretch;flex-direction:column}.learning-path-card-cta{width:100%}}
      `}</style>
    </article>
  );
}
