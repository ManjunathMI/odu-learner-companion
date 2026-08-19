'use client';

import { use } from 'react';
import PathSettings from '@/components/PathSettings';

export default function PathSettingsPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = use(params);
  return <PathSettings pathId={pathId} />;
}
