import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiMemberDirectory } from '@/lib/path-member-directory';
import { requirePathModerator, unauthorized, forbidden } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathModerator(user.id, pathId))) return forbidden('Moderator or admin access required');

  try {
    return Response.json(await apiMemberDirectory(pathId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to load members' }, { status: 500 });
  }
}
