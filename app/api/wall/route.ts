import { adminClient } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await adminClient.from('learning_paths').select('id, title, description, tags, created_at').eq('visibility', 'public').eq('wall_status', 'approved').order('created_at', { ascending: false });
  if (error) return Response.json({ error: 'Failed to load wall' }, { status: 500 });

  const paths = await Promise.all((data || []).map(async (path) => {
    const { count } = await adminClient.from('path_memberships').select('id', { count: 'exact', head: true }).eq('path_id', path.id).eq('status', 'approved');
    return { id: path.id, title: path.title, description: path.description, tags: path.tags, memberCount: count || 0, createdAt: path.created_at };
  }));
  return Response.json(paths);
}
