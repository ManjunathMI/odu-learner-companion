import Link from 'next/link';

const documents: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  'business-guide': {
    title: 'Business Guide',
    sections: [
      { heading: 'What the product does', text: 'ODU Learner Companion is a multi-tenant platform for certification journeys, onboarding programs, and community-led learning. Each learning path owns its content, members, roles, progress, notes, and leaderboard.' },
      { heading: 'Roles', text: 'Visitors browse approved public paths. Learners study and track progress. Moderators review join requests for one path. Path admins manage one path. Platform admins handle platform-wide operations.' },
      { heading: 'Core workflow', text: 'A user signs in with Supabase email OTP, creates or joins a path, receives approval when required, and then works through the path plan while recording progress and notes.' },
    ],
  },
  architecture: {
    title: 'Architecture',
    sections: [
      { heading: 'System shape', text: 'Web and future React Native clients call the same Next.js API route handlers over HTTPS. Supabase provides authentication, PostgreSQL, and Row Level Security.' },
      { heading: 'Tenant boundaries', text: 'learning_paths is the tenant root. Membership, content, progress, notes, and feedback are scoped by path_id. A user may have different roles on different paths.' },
      { heading: 'Mobile compatibility', text: 'Browser sessions use Supabase SSR cookies. Mobile clients can send the Supabase access token as Authorization: Bearer <token> to reuse the same API contracts.' },
    ],
  },
  development: {
    title: 'Development Guide',
    sections: [
      { heading: 'Start locally', text: 'Install Node.js 22 or later and npm, create .env.local, run the canonical phase1-schema.sql in Supabase SQL Editor, then run npm install and npm run dev.' },
      { heading: 'Environment', text: 'Use NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_BASE_URL, and the server-only SUPABASE_SERVICE_ROLE_KEY. Never expose or commit the service-role key.' },
      { heading: 'Verification', text: 'Run npm run build and npm run lint before contributing. Do not run legacy single-room database scripts.' },
    ],
  },
  api: {
    title: 'API Reference',
    sections: [
      { heading: 'Public endpoints', text: 'GET /api/wall lists approved public paths. GET /api/paths/:pathId returns path metadata and hides unauthorized private paths with 404.' },
      { heading: 'Membership and content', text: 'POST /api/paths/:pathId creates a path. GET and PUT /plan manage content. POST /join and POST /approvals/:userId manage membership lifecycle.' },
      { heading: 'Learning activity', text: 'POST /progress, GET /leaderboard, and GET/POST /notes are approved-member endpoints. Activity writes always include path_id and validate lesson ownership.' },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(documents).map((slug) => ({ slug }));
}

export default async function DocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const document = documents[slug];
  if (!document) return <main className="document"><h1>Document not found</h1><Link href="/docs">Back to docs</Link></main>;
  return <main className="document"><Link href="/docs" className="back">← Documentation</Link><p className="eyebrow">ODU Learner Companion</p><h1>{document.title}</h1>{document.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.text}</p></section>)}<style>{`.document{max-width:820px;margin:0 auto;padding:3rem 1rem}.back{display:inline-block;margin-bottom:2rem;color:var(--accent-primary)}.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.75rem;font-weight:700;color:var(--accent-primary)}h1{font-size:clamp(2rem,5vw,3rem);margin:.25rem 0 2rem}section{border-top:1px solid var(--border-color);padding:1.5rem 0}h2{font-size:1.2rem;margin:0 0 .5rem}section p{color:var(--text-secondary);max-width:70ch}`}</style></main>;
}
