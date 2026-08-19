// app/api/learners/status/route.ts
import { NextRequest } from 'next/server';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Check if user is an approved learner (can be in multiple rooms)
    const { data: learner, error: learnerError } = await supabaseAdmin
      .from('learners')
      .select('room_code, learner_name')
      .eq('user_id', user.id)
      .single();

    if (!learnerError && learner) {
      return Response.json({
        status: 'approved',
        roomCode: learner.room_code,
        name: learner.learner_name,
      });
    }

    // Check if user has a pending request
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_learners')
      .select('room_code, learner_name, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!pendingError && pending) {
      return Response.json({
        status: 'pending',
        roomCode: pending.room_code,
        name: pending.learner_name,
      });
    }

    // Check if user has been rejected
    const { data: rejected, error: rejectedError } = await supabaseAdmin
      .from('pending_learners')
      .select('room_code, learner_name, status')
      .eq('user_id', user.id)
      .eq('status', 'rejected')
      .single();

    if (!rejectedError && rejected) {
      return Response.json({
        status: 'rejected',
        roomCode: rejected.room_code,
        name: rejected.learner_name,
      });
    }

    // User hasn't requested yet
    return Response.json({
      status: 'unknown',
      message: 'No request found. Please submit a join request.',
    });
  } catch (error) {
    console.error('Error in GET /api/learners/status:', error);
    return errorResponse('Internal server error', 500);
  }
}
