import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathMember, unauthorized, forbidden, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string; itemId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId, itemId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathMember(user.id, pathId))) return forbidden('Approved membership required');
  const { data, error } = await adminClient.from('notes').select('user_id, note_text, created_at').eq('path_id', pathId).eq('item_key', itemId).order('created_at');
  if (error) return Response.json({ error: 'Failed to load notes' }, { status: 500 });
  return Response.json((data || []).map((note) => ({ userId: note.user_id, text: note.note_text, createdAt: note.created_at })));
}
