import { NextRequest } from 'next/server';
import { getSession, requirePlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { forbidden, unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePlatformAdmin(user.id))) return forbidden('Platform admin access required');

  const { data, error } = await adminClient.from('quota_requests').select('id, user_id, current_limit, requested_limit, reason, status, created_at, reviewed_at').order('created_at', { ascending: false });
  if (error) return Response.json({ error: 'Failed to load quota requests' }, { status: 500 });
  const userIds = [...new Set((data ?? []).map((request) => request.user_id))];
  const { data: profiles, error: profileError } = userIds.length ? await adminClient.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds) : { data: [], error: null };
  if (profileError) return Response.json({ error: 'Failed to load requester profiles' }, { status: 500 });
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  return Response.json((data ?? []).map((request) => ({ ...request, requester: profileMap.get(request.user_id) ?? null })));
}