import Markdown from 'react-markdown';
import { materialViewPlugin, type MaterialView } from '@/lib/learning-material';
import './learning-content.css';

// Content comes from the path APIs; no course-specific Git imports or identity checks.
export default function LearningContent({ markdown, view = 'all' }: { markdown: string; view?: MaterialView }) {
  return <div className={`learning-content ${view === 'resources' || view === 'library' ? 'resource-list' : ''}`}>
    <Markdown skipHtml remarkPlugins={[[materialViewPlugin, { view }]]} components={{
      h1: ({ children }) => <h4>{children}</h4>,
      h2: ({ children }) => <h4>{children}</h4>,
      h3: ({ children }) => <h4>{children}</h4>,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="external-link-mark" aria-hidden="true"> ↗</span></a>,
      img: ({ alt }) => <span>{alt}</span>,
    }}>{markdown}</Markdown>
  </div>;
}
