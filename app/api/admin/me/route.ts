// app/api/admin/me/route.ts
import { NextRequest } from 'next/server';
import { getSession, isAdmin, errorResponse } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const adminStatus = isAdmin(user.id);

    if (!adminStatus) {
      return errorResponse('Forbidden: Not an admin', 403);
    }

    return Response.json({ isAdmin: true, userId: user.id });
  } catch (error) {
    console.error('Error in GET /api/admin/me:', error);
    return errorResponse('Internal server error', 500);
  }
}
