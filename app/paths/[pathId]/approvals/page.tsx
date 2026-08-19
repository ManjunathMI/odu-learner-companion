'use client';

import { use } from 'react';
import ApprovalsPanel from '@/components/ApprovalsPanel';

export default function ApprovalsPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = use(params);
  return <ApprovalsPanel pathId={pathId} />;
}
