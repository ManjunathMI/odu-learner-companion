// app/api/admin/approvals/[userId]/route.ts
import { NextRequest } from 'next/server';
import { getSession, isAdmin, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    const targetUserId = params.userId;
    const body = await req.json();
    const { decision } = body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return errorResponse('Invalid decision: must be "approved" or "rejected"', 400);
    }

    // Get the pending request
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_learners')
      .select('id, user_id, room_code, learner_name')
      .eq('user_id', targetUserId)
      .eq('status', 'pending')
      .single();

    if (pendingError || !pending) {
      return errorResponse('Pending request not found', 404);
    }

    if (decision === 'approved') {
      // Insert into learners table
      const { error: learnerError } = await supabaseAdmin
        .from('learners')
        .insert({
          user_id: pending.user_id,
          room_code: pending.room_code,
          learner_name: pending.learner_name,
          joined_at: new Date().toISOString(),
        });

      if (learnerError) {
        console.error('Insert learner error:', learnerError);
        return errorResponse('Error approving learner', 500);
      }
    }

    // Update pending_learners status
    const { error: updateError } = await supabaseAdmin
      .from('pending_learners')
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
      })
      .eq('id', pending.id);

    if (updateError) {
      return errorResponse('Error updating request', 500);
    }

    return Response.json({
      status: decision,
      userId: pending.user_id,
      roomCode: pending.room_code,
      message: `Learner ${decision}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/approvals/[userId]:', error);
    return errorResponse('Internal server error', 500);
  }
}
