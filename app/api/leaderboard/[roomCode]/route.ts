// app/api/leaderboard/[roomCode]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin, errorResponse } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { roomCode: string } }) {
  try {
    const roomCode = params.roomCode;

    if (!roomCode) {
      return errorResponse('Room code required', 400);
    }

    // Get all approved learners for this room
    const { data: learners, error: learnersError } = await supabaseAdmin
      .from('learners')
      .select('id, user_id, learner_name')
      .eq('room_code', roomCode);

    if (learnersError) {
      return errorResponse('Error fetching leaderboard', 500);
    }

    if (!learners || learners.length === 0) {
      return Response.json([]);
    }

    // Get total items for the room's course plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('course_plans')
      .select('id')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return errorResponse('Course plan not found', 404);
    }

    // Count total lesson items
    const { data: totalItems, error: totalError } = await supabaseAdmin
      .rpc('count_lesson_items', { plan_id: plan.id });

    if (totalError) {
      return errorResponse('Error counting items', 500);
    }

    const totalCount = totalItems?.[0]?.count || 0;

    // Get progress for each learner
    const leaderboard = await Promise.all(
      learners.map(async (learner) => {
        const { data: progressData, error: progressError } = await supabaseAdmin
          .from('progress')
          .select('*')
          .eq('user_id', learner.user_id)
          .eq('done', true);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        }

        return {
          name: learner.learner_name,
          doneCount: progressData?.length || 0,
          total: totalCount,
        };
      })
    );

    // Sort by completion descending
    leaderboard.sort((a, b) => b.doneCount - a.doneCount);

    return Response.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return errorResponse('Internal server error', 500);
  }
}
