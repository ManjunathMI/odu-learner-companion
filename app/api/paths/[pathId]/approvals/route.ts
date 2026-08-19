import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathModerator, unauthorized, forbidden, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathModerator(user.id, pathId))) return forbidden('Moderator or admin access required');
  const { data, error } = await adminClient.from('path_memberships').select('id, user_id, role, status, joined_at').eq('path_id', pathId).eq('status', 'pending').order('joined_at');
  if (error) return Response.json({ error: 'Failed to load approvals' }, { status: 500 });
  return Response.json(data || []);
}
