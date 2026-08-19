import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized, notFound, badRequest } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();

  const { data: path } = await adminClient.from('learning_paths').select('id').eq('id', pathId).maybeSingle();
  if (!path) return notFound();
  const body = await req.json().catch(() => ({}));
  const { error } = await adminClient.from('path_memberships').insert({ user_id: user.id, path_id: pathId, role: 'learner', status: 'pending' });
  if (error?.code === '23505') return Response.json({ error: 'Already requested or a member' }, { status: 409 });
  if (error) return Response.json({ error: 'Failed to submit join request' }, { status: 500 });
  return Response.json({ status: 'pending' }, { status: 201 });
}
