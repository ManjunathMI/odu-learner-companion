import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathAdmin, unauthorized, forbidden, badRequest, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string; userId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { pathId, userId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathAdmin(user.id, pathId))) return forbidden('Admin access required');

  const body = await req.json().catch(() => ({}));
  const action = body.action;
  if (!['promote', 'demote', 'remove'].includes(action)) return badRequest('action must be promote, demote, or remove');

  if (action === 'remove') {
    const { error } = await adminClient.from('path_memberships').delete().eq('path_id', pathId).eq('user_id', userId);
    if (error) return Response.json({ error: 'Failed to remove member' }, { status: 500 });
    return Response.json({ success: true });
  }

  const nextRole = action === 'promote' ? 'moderator' : 'learner';
  const { data, error } = await adminClient
    .from('path_memberships')
    .update({ role: nextRole })
    .eq('path_id', pathId)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .select('user_id')
    .maybeSingle();

  if (error) return Response.json({ error: 'Failed to update member role' }, { status: 500 });
  if (!data) return notFound('Approved member not found');
  return Response.json({ success: true });
}
