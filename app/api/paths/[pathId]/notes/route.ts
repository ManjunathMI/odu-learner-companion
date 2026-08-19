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
  if (typeof body.itemId !== 'string' || typeof body.text !== 'string' || !body.text.trim()) return badRequest('itemId and non-empty text are required');
  const { data: item } = await adminClient.from('lesson_items').select('id, day_id').eq('id', body.itemId).maybeSingle();
  if (!item) return notFound('Lesson item not found in this path');
  const { data: day } = await adminClient.from('days').select('id, phase_id').eq('id', item.day_id).maybeSingle();
  const { data: phase } = day ? await adminClient.from('phases').select('id').eq('id', day.phase_id).eq('path_id', pathId).maybeSingle() : { data: null };
  if (!phase) return notFound('Lesson item not found in this path');
  const { data, error } = await adminClient.from('notes').insert({ path_id: pathId, item_key: body.itemId, user_id: user.id, note_text: body.text.trim() }).select('id, user_id, note_text, created_at').single();
  if (error) return Response.json({ error: 'Failed to save note' }, { status: 500 });
  return Response.json({ userId: data.user_id, text: data.note_text, createdAt: data.created_at }, { status: 201 });
}
