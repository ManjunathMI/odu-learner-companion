import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformOwner } from '@/lib/auth';
import PlatformWorkspace from '@/components/admin/PlatformWorkspace';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/admin');
  if (!(await requirePlatformOwner(user))) notFound();
  return <PlatformWorkspace />;
}
