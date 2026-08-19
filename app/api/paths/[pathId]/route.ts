import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { getMembership, requirePathAdmin, unauthorized, forbidden, notFound, badRequest } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  const { data: path, error } = await adminClient.from('learning_paths').select('id, title, description, tags, visibility, wall_status, created_by, created_at, updated_at').eq('id', pathId).maybeSingle();
  if (error || !path) return notFound();

  if (path.visibility === 'private') {
    const privateMembership = user ? await getMembership(user.id, pathId) : null;
    if (privateMembership?.status !== 'approved') return notFound();
  }

  const membership = user ? await getMembership(user.id, pathId) : null;
  return Response.json({
    id: path.id,
    title: path.title,
    description: path.description,
    tags: path.tags,
    visibility: path.visibility,
    wallStatus: path.wall_status,
    myRole: membership?.status === 'approved' ? membership.role : null,
  });
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathAdmin(user.id, pathId))) return forbidden('Admin access required');

  const body = await req.json().catch(() => ({}));
  const updates: {
    title?: string;
    description?: string | null;
    tags?: string[];
    visibility?: 'public' | 'private';
    updated_at?: string;
  } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return badRequest('title cannot be empty');
    updates.title = body.title.trim();
  }
  if (body.description !== undefined) updates.description = typeof body.description === 'string' ? body.description.trim() || null : null;
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return badRequest('tags must be an array');
    updates.tags = body.tags.filter((tag: unknown): tag is string => typeof tag === 'string').map((tag: string) => tag.trim()).filter(Boolean);
  }
  if (body.visibility !== undefined) {
    if (!['public', 'private'].includes(body.visibility)) return badRequest('visibility must be public or private');
    updates.visibility = body.visibility;
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await adminClient.from('learning_paths').update(updates).eq('id', pathId).select('id, title, description, tags, visibility, wall_status, updated_at').single();
  if (error) return Response.json({ error: 'Failed to update path' }, { status: 500 });
  return Response.json({ ...data, wallStatus: data.wall_status });
}
