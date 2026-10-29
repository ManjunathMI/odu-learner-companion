import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathMember, requirePathAdmin, unauthorized, forbidden, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user || !(await requirePathMember(user.id, pathId))) return notFound();
  const { data, error } = await adminClient.rpc('read_learning_plan', { p_path_id: pathId });
  if (error) return Response.json({ error: 'Failed to load plan' }, { status: 500 });
  return data ? Response.json(data) : notFound();
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathAdmin(user.id, pathId))) return forbidden('Admin access required');
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.phases)) return Response.json({ error: 'phases must be an array' }, { status: 400 });
  if (JSON.stringify(body).length > 1_048_576) return Response.json({ error: 'Curriculum is too large' }, { status: 413 });
  if (body.revision !== undefined && (!Number.isInteger(body.revision) || body.revision < 0)) {
    return Response.json({ error: 'Invalid curriculum revision' }, { status: 400 });
  }
  const { data, error } = await adminClient.rpc('save_learning_plan', {
    p_path_id: pathId,
    p_actor: user.id,
    p_phases: body.phases,
    p_expected_revision: body.revision ?? null,
    p_confirm_removals: body.confirmRemovals === true,
  });
  if (error) {
    if (['40001', 'PT409'].includes(error.code)) return Response.json({ error: error.message }, { status: 409 });
    if (['22023', '22P02', '22001'].includes(error.code)) return Response.json({ error: error.message }, { status: 400 });
    if (error.code === '42501') return forbidden('Admin access required');
    if (error.code === 'P0002') return notFound();
    console.error('Save plan error:', error.code);
    return Response.json({ error: 'Could not confirm the curriculum save. Reload the curriculum before retrying.' }, { status: 500 });
  }
  return Response.json(data);
}
