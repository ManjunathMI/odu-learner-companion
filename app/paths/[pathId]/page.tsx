import type { Metadata } from 'next';
import { adminClient } from '@/lib/supabase/server';
import PathBoard from '@/components/PathBoard';

type Props = {
  params: Promise<{ pathId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params;

  try {
    const { data: path } = await adminClient
      .from('learning_paths')
      .select('id, title, description, visibility, wall_status')
      .eq('id', pathId)
      .maybeSingle();

    if (path && path.visibility === 'public' && path.wall_status === 'approved') {
      const title = path.title;
      const description = path.description || 'Follow this structured Learning Path on ODU Learner Companion.';

      return {
        title,
        description,
        openGraph: {
          title: `${title} | ODU Learner Companion`,
          description,
          type: 'article',
        },
        twitter: {
          card: 'summary',
          title: `${title} | ODU Learner Companion`,
          description,
        },
      };
    }
  } catch {
    // Database unreachable or query error - fallback safely
  }

  return {
    title: 'Learning Space',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PathBoardPage({ params }: Props) {
  const { pathId } = await params;
  return <PathBoard pathId={pathId} />;
}
