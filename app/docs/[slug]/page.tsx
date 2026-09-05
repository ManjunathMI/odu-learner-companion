import Link from 'next/link';

const documents: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  'business-guide': {
    title: 'Business Guide',
    sections: [
      { heading: 'Product vision', text: 'ODU Learner Companion is a collaborative learning companion for students, professionals, and lifelong learners. Learn anything. Together. ODU helps people discover a goal, join or create a Learning Space, follow a structured Learning Path, collaborate, practice, track progress, and grow. It is not a traditional course marketplace or a generic social network.' },
      { heading: 'Product vocabulary', text: 'The public wall is Explore / Learning Wall. My Paths becomes My Journey. A path board is a Learning Space, notes are Personal Notes, the leaderboard is Community Progress, and a path admin is a Space Creator / Facilitator. Learning Space is product language around the existing learning_paths tenant, not a new database hierarchy.' },
      { heading: 'Roles and boundaries', text: 'Visitors browse approved public paths. Approved learners enter Learning Spaces, track their own progress, add personal notes, and view permitted community progress. Moderators review join requests for one path. Space Creators / Path Admins manage one path. Platform Admins handle explicitly supported platform-wide operations. UI language must not imply broader permissions.' },
      { heading: 'Core workflows', text: 'A visitor discovers a public Learning Path, signs in with Supabase email OTP, and requests membership when required. Once approved, the path appears in My Journey. Learners work through the plan while recording progress and notes; creators manage metadata, plans, and membership.' },
      { heading: 'AI Companion', text: 'AI is a planned supporting capability for explanations, quizzes, learning-plan generation, knowledge-gap identification, and next-step suggestions. Until the backend exists, the product must label these capabilities as planned or coming soon and must not imply that they are available.' },
    ],
  },
  architecture: {
    title: 'Architecture',
    sections: [
      { heading: 'System shape', text: 'Web and future React Native clients call the same Next.js API route handlers over HTTPS. Supabase provides authentication, PostgreSQL, and Row Level Security.' },
      { heading: 'Product information architecture', text: 'The user-facing structure is Explore / Learning Wall for topics and approved public paths, Learning Spaces for collaborative experiences around a path, and My Journey for goals, active spaces, progress, next action, and Personal Notes. AI Companion remains a planned supporting layer. These concepts do not require matching database tables.' },
      { heading: 'Repository structure', text: 'The presentation layer lives in app/, API route handlers in app/api/, shared auth and Supabase logic in lib/, database types in types/database.ts, reusable discovery and journey UI in components/, and maintained project guidance in docs/. Existing /paths routes remain compatibility surfaces while /explore and /journey carry the newer product experience.' },
      { heading: 'Tenant boundaries', text: 'learning_paths is the tenant root. Its hierarchy is phases, days, and lesson_items. Membership, progress, notes, and feedback are scoped by path_id, so a user may have different roles on different paths. Do not introduce a separate learning_spaces tenant hierarchy without an explicit product decision.' },
      { heading: 'Authorization', text: 'PostgreSQL RLS and explicit server-side checks are the security boundary. Public discovery exposes only approved public paths. Private content is restricted to approved members and authorized administrators. Platform-admin access is an explicit elevated override and does not change ordinary path permissions.' },
      { heading: 'Mobile compatibility', text: 'Browser sessions use Supabase SSR cookies. Mobile clients can send the Supabase access token as Authorization: Bearer <token> to reuse the same API contracts.' },
    ],
  },
  roadmap: {
    title: 'Product Roadmap',
    sections: [
      { heading: 'Product direction', text: 'The product journey is Discover, choose a learning goal, join or create a Learning Space, Learn, Collaborate, Practice, Track progress, Reflect, and Grow. The current foundation stays in place while the experience moves from a learning tracker toward a collaborative learning companion.' },
      { heading: 'Foundation delivered', text: 'The foundation includes Supabase email OTP authentication, approved public-path discovery, user-created paths, creator-to-admin membership through a database trigger, nested learning plans, membership requests and approvals, progress, leaderboards, notes, profiles, public documentation, and bearer-token-compatible APIs.' },
      { heading: 'Phase 1.5 status', text: 'The homepage and /explore share public-path search and tag filtering. /journey provides active-space, progress, and pending-membership summaries while /paths remains a compatibility route. Existing path-board functionality is presented as a Learning Space with clearer progress navigation, retry behavior, and accessible tabs. Public navigation, footer language, skip navigation, and responsive discovery layouts use the preferred vocabulary.' },
      { heading: 'Remaining Phase 1.5 work', text: 'Broader form-state standardization, deeper member presentation, and a full accessibility review remain. The next larger phase focuses on a guided plan editor, membership-management improvements, and carefully scoped community features.' },
      { heading: 'Later phases', text: 'Phase 3 explores an AI Companion, Phase 4 evaluates recognition and milestones, Phase 5 hardens production operations, and Phase 6 can add React Native clients using the existing server APIs. Planned functionality must not be presented as implemented.' },
    ],
  },
  'database-operations': {
    title: 'Database Operations',
    sections: [
      { heading: 'Canonical schema', text: 'Run the canonical phase1-schema.sql from the private design materials in Supabase SQL Editor, from top to bottom. Do not run the deleted legacy single-room schema. The schema owns learning paths, memberships, plans, progress, notes, feedback, badges, RLS policies, helper functions, grants, and the creator-admin trigger.' },
      { heading: 'Platform admin setup', text: 'After a user has signed in at least once, insert that user into platform_admins with an idempotent insert. A platform-admin row is separate from a path-admin membership: platform admins operate across the platform, while path admins manage one Learning Path.' },
      { heading: 'Role test bed', text: 'For local UX and authorization testing, seed separate visitor, learner, moderator, path-admin, and platform-admin users, then attach them to a public approved path with the intended membership statuses. Use placeholder user IDs and never place credentials or service-role keys in this documentation.' },
      { heading: 'Public path rules', text: 'A path appears on the public wall only when visibility is public and wall_status is approved. Newly created paths currently default to private and pending review. Approving every future path by default bypasses the intended review workflow and should be treated as an explicit product decision.' },
      { heading: 'Verification', text: 'Verify platform-admin rows by joining platform_admins to auth.users. Verify creator behavior through path_memberships: creating a path should result in role = admin and status = approved through the database trigger. Keep all test data and approval changes scoped to the intended local or staging environment.' },
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
