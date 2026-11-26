import { NextRequest } from 'next/server';
import { getSessionStatus, isPlatformAdmin, requirePlatformOwner } from '@/lib/auth';
import { unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const session = await getSessionStatus(req);
  if (session.status === 'unauthenticated') return unauthorized();
  if (session.status === 'suspended') {
    return Response.json({ error: 'This account is suspended.' }, { status: 403 });
  }
  if (session.status === 'unavailable') {
    return Response.json({ error: 'Account access could not be verified. Try again later.' }, { status: 503 });
  }
  const { user } = session;

  return Response.json({
    user: {
      id: user.id,
      email: user.email,
    },
    isPlatformAdmin: await isPlatformAdmin(user.id),
    isPlatformOwner: await requirePlatformOwner(user),
  });
}
