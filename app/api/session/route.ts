import { NextRequest } from 'next/server';
import { getSession, isPlatformAdmin, requirePlatformOwner } from '@/lib/auth';
import { unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
    },
    isPlatformAdmin: await isPlatformAdmin(user.id),
    isPlatformOwner: await requirePlatformOwner(user),
  });
}
