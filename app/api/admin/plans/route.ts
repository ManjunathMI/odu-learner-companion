// app/api/admin/plans/route.ts
import { NextRequest } from 'next/server';
import { getSession, isAdmin, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    // Get all course plans
    const { data: plans, error } = await supabaseAdmin
      .from('course_plans')
      .select('id, room_code, title, subtitle, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse('Error fetching plans', 500);
    }

    return Response.json(plans || []);
  } catch (error) {
    console.error('Error in GET /api/admin/plans:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    const body = await req.json();
    const { roomCode, title, subtitle } = body;

    if (!roomCode || !title) {
      return errorResponse('Missing fields: roomCode, title', 400);
    }

    // Insert course plan
    const { data, error } = await supabaseAdmin
      .from('course_plans')
      .insert({
        room_code: roomCode,
        title,
        subtitle: subtitle || '',
        is_active: true,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      if (error.code === '23505') {
        return errorResponse('Room code already exists', 409);
      }
      return errorResponse('Error creating plan', 500);
    }

    return Response.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/plans:', error);
    return errorResponse('Internal server error', 500);
  }
}
