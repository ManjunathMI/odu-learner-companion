import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathMember, unauthorized, forbidden, badRequest, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathMember(user.id, pathId))) return forbidden('Approved membership required');
  const body = await req.json().catch(() => ({}));
  if (typeof body.itemId !== 'string' || typeof body.done !== 'boolean') return badRequest('itemId and done are required');

  const { data: item } = await adminClient.from('lesson_items').select('id, day_id').eq('id', body.itemId).maybeSingle();
  if (!item) return notFound('Lesson item not found in this path');
  const { data: day } = await adminClient.from('days').select('id, phase_id').eq('id', item.day_id).maybeSingle();
  const { data: phase } = day ? await adminClient.from('phases').select('id, path_id').eq('id', day.phase_id).maybeSingle() : { data: null };
  if (!phase || phase.path_id !== pathId) return notFound('Lesson item not found in this path');
  const { error } = await (adminClient.from('progress') as any).upsert({ user_id: user.id, path_id: pathId, item_key: body.itemId, done: body.done, updated_at: new Date().toISOString() }, { onConflict: 'user_id,item_key' });
  if (error) return Response.json({ error: 'Failed to save progress' }, { status: 500 });
  return Response.json({ success: true });
}
