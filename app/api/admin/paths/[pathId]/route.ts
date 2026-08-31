import { NextRequest } from 'next/server';
import { getSession, requirePlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized, forbidden, badRequest, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePlatformAdmin(user.id))) return forbidden('Platform admin access required');

  const body = await req.json().catch(() => ({}));
  if (!['approved', 'rejected', 'unlisted'].includes(body.decision)) {
    return badRequest('decision must be approved, rejected, or unlisted');
  }

  const nextStatus = body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'rejected' : 'unlisted';

  const { data, error } = await adminClient
    .from('learning_paths')
    .update({ wall_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', pathId)
    .select('id')
    .maybeSingle();

  if (error) return Response.json({ error: 'Failed to update path status' }, { status: 500 });
  if (!data) return notFound('Path not found');

  return Response.json({ success: true });
}
