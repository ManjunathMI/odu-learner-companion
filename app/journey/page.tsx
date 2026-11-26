import JourneyDashboard from '@/components/journey/JourneyDashboard';
import { loadCreatorQuota } from '@/lib/creator-quota';
import { adminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function JourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const [quota, request] = await Promise.all([
    loadCreatorQuota(user.id),
    adminClient.from('quota_requests').select('requested_limit').eq('user_id', user.id)
      .eq('status', 'pending').maybeSingle(),
  ]);

  return <JourneyDashboard quota={quota && !request.error
    ? { ...quota, pendingLimit: request.data?.requested_limit ?? null }
    : null} />;
}
