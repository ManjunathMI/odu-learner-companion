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

  const { data, error } = await adminClient.rpc('create_learning_path_with_entitlement', {
    p_title: title.trim(),
    p_description: description?.trim() || null,
    p_tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
    p_created_by: user.id,
  });

  if (error) {
    if (error.code === '23514' && error.message.includes('creator quota exceeded')) {
      return Response.json({ error: 'Creator quota reached. Request a higher limit to create another Learning Path.' }, { status: 409 });
    }
    console.error('Create path error:', error);
    return Response.json({ error: 'Failed to create path' }, { status: 500 });
  }

  const created = Array.isArray(data) ? data[0] : data;
  if (!created) return Response.json({ error: 'Failed to create path' }, { status: 500 });

  return Response.json(
    {
      id: created.id,
      title: created.title,
      visibility: created.visibility,
      wallStatus: created.wall_status,
    },
    { status: 201 }
  );
}
