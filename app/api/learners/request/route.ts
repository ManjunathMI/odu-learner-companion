// app/api/learners/request/route.ts
import { NextRequest } from 'next/server';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { name, joinCode } = body;

    if (!name || typeof name !== 'string') {
      return errorResponse('Missing field: name (string)', 400);
    }

    if (name.trim().length < 2) {
      return errorResponse('Name must be at least 2 characters', 400);
    }

    // Default room code if not provided
    const roomCode = joinCode || 'default';

    // Check if course plan exists and is active
    const { data: plan, error: planError } = await supabaseAdmin
      .from('course_plans')
      .select('id')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return errorResponse('Invalid room code or course plan not active', 404);
    }

    // Check if name already exists in learners for this room
    const { data: existingLearner, error: learnerError } = await supabaseAdmin
      .from('learners')
      .select('id')
      .eq('room_code', roomCode)
      .eq('learner_name', name.trim())
      .single();

    if (!learnerError && existingLearner) {
      return errorResponse('Name already taken in this course', 409);
    }

    // Check if name already exists in pending_learners
    const { data: existingPending, error: pendingError } = await supabaseAdmin
      .from('pending_learners')
      .select('id')
      .eq('room_code', roomCode)
      .eq('learner_name', name.trim())
      .single();

    if (!pendingError && existingPending) {
      return errorResponse('Name already requested in this course', 409);
    }

    // Insert into pending_learners
    const { data, error } = await supabaseAdmin
      .from('pending_learners')
      .insert({
        user_id: user.id,
        room_code: roomCode,
        learner_name: name.trim(),
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return errorResponse('Error submitting request', 500);
    }

    return Response.json({ status: 'pending', message: 'Request submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/learners/request:', error);
    return errorResponse('Internal server error', 500);
  }
}
