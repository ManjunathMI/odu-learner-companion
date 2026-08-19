// app/api/plans/[roomCode]/route.ts
import { NextRequest } from 'next/server';
import { supabaseAdmin, errorResponse } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { roomCode: string } }) {
  try {
    const roomCode = params.roomCode;

    if (!roomCode) {
      return errorResponse('Room code required', 400);
    }

    // Get active plan with nested structure
    const { data: plans, error: planError } = await supabaseAdmin
      .from('course_plans')
      .select('id, title, subtitle')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (planError || !plans) {
      return errorResponse('Course plan not found', 404);
    }

    // Get phases
    const { data: phases, error: phasesError } = await supabaseAdmin
      .from('phases')
      .select('id, title, goal')
      .eq('plan_id', plans.id)
      .order('sort_order', { ascending: true });

    if (phasesError) {
      return errorResponse('Error fetching phases', 500);
    }

    // Get days for each phase
    const phasesWithDays = await Promise.all(
      (phases || []).map(async (phase) => {
        const { data: days, error: daysError } = await supabaseAdmin
          .from('days')
          .select('id, day_label, title, hours')
          .eq('phase_id', phase.id)
          .order('sort_order', { ascending: true });

        if (daysError) throw new Error('Error fetching days');

        // Get items for each day
        const daysWithItems = await Promise.all(
          (days || []).map(async (day) => {
            const { data: items, error: itemsError } = await supabaseAdmin
              .from('lesson_items')
              .select('id, title, url, tag')
              .eq('day_id', day.id)
              .order('sort_order', { ascending: true });

            if (itemsError) throw new Error('Error fetching items');

            return {
              id: day.id,
              dayLabel: day.day_label,
              title: day.title,
              hours: day.hours,
              items: items || [],
            };
          })
        );

        return {
          id: phase.id,
          title: phase.title,
          goal: phase.goal,
          days: daysWithItems,
        };
      })
    );

    return Response.json({
      title: plans.title,
      subtitle: plans.subtitle,
      phases: phasesWithDays,
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return errorResponse('Internal server error', 500);
  }
}
