import { NextRequest } from 'next/server';
import { getSession, requirePlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized, forbidden } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePlatformAdmin(user.id))) return forbidden('Platform admin access required');

  const { data, error } = await adminClient
    .from('learning_paths')
    .select('id, title, description, tags, created_by, created_at, visibility, wall_status')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: 'Failed to load platform paths' }, { status: 500 });
  return Response.json(data ?? []);
}
