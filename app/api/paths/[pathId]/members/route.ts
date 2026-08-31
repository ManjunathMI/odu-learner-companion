import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathModerator, unauthorized, forbidden } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathModerator(user.id, pathId))) return forbidden('Moderator or admin access required');

  const { data, error } = await adminClient
    .from('path_memberships')
    .select('id, user_id, role, status, joined_at')
    .eq('path_id', pathId)
    .order('joined_at', { ascending: false });

  if (error) return Response.json({ error: 'Failed to load members' }, { status: 500 });

  const userIds = (data ?? []).map((member) => member.user_id);
  const { data: profiles, error: profileError } = userIds.length
    ? await adminClient.from('profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: [], error: null };

  if (profileError) return Response.json({ error: 'Failed to load member profiles' }, { status: 500 });

  const displayMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));

  return Response.json((data ?? []).map((member) => ({
    ...member,
    display_name: displayMap.get(member.user_id) ?? null,
  })));
}
