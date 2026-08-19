import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathModerator, unauthorized, forbidden, badRequest, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string; userId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { pathId, userId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathModerator(user.id, pathId))) return forbidden('Moderator or admin access required');
  const body = await req.json().catch(() => ({}));
  if (!['approved', 'rejected'].includes(body.decision)) return badRequest('decision must be approved or rejected');

  const { data, error } = await adminClient.from('path_memberships').update({ status: body.decision, decided_at: new Date().toISOString() }).eq('path_id', pathId).eq('user_id', userId).eq('status', 'pending').select('status').maybeSingle();
  if (error) return Response.json({ error: 'Failed to update membership' }, { status: 500 });
  if (!data) return notFound('Pending membership not found');
  return Response.json({ success: true });
}
