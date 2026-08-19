'use client';

import { use } from 'react';
import PathBoard from '@/components/PathBoard';

export default function PathBoardPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = use(params);
  return <PathBoard pathId={pathId} />;
}
