import 'server-only';
import { type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, tags } = body as {
    title?: string;
    description?: string;
    tags?: string[];
  };

  if (!title?.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('learning_paths')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
      created_by: user.id,
      // visibility defaults to 'private', wall_status to 'pending_review' per schema
    })
    .select('id, title, visibility, wall_status')
    .single();

  if (error) {
    console.error('Create path error:', error);
    return Response.json({ error: 'Failed to create path' }, { status: 500 });
  }

  return Response.json(
    {
      id: data.id,
      title: data.title,
      visibility: data.visibility,
      wallStatus: data.wall_status,
    },
    { status: 201 }
  );
}
