// app/api/admin/plans/[id]/route.ts
import { NextRequest } from 'next/server';
import { getSession, isAdmin, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    const planId = params.id;
    const body = await req.json();
    const { title, subtitle, phases } = body;

    if (!title) {
      return errorResponse('Missing field: title', 400);
    }

    // Update plan
    const { error: planError } = await supabaseAdmin
      .from('course_plans')
      .update({
        title,
        subtitle: subtitle || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);

    if (planError) {
      return errorResponse('Error updating plan', 500);
    }

    // If phases provided, update the nested structure
    if (Array.isArray(phases)) {
      for (const phase of phases) {
        if (!phase.id) {
          // Create new phase
          const { data: newPhase, error: phaseError } = await supabaseAdmin
            .from('phases')
            .insert({
              plan_id: planId,
              title: phase.title,
              goal: phase.goal || '',
              sort_order: phase.sort_order || 0,
            })
            .select()
            .single();

          if (phaseError || !newPhase) {
            return errorResponse('Error creating phase', 500);
          }

          // Add days for this phase
          if (Array.isArray(phase.days)) {
            for (const day of phase.days) {
              const { data: newDay, error: dayError } = await supabaseAdmin
                .from('days')
                .insert({
                  phase_id: newPhase.id,
                  day_label: day.dayLabel,
                  title: day.title,
                  hours: day.hours || 1,
                  sort_order: day.sort_order || 0,
                })
                .select()
                .single();

              if (dayError || !newDay) {
                return errorResponse('Error creating day', 500);
              }

              // Add items for this day
              if (Array.isArray(day.items)) {
                for (const item of day.items) {
                  const { error: itemError } = await supabaseAdmin
                    .from('lesson_items')
                    .insert({
                      day_id: newDay.id,
                      title: item.title,
                      url: item.url || '',
                      tag: item.tag || '',
                      sort_order: item.sort_order || 0,
                    });

                  if (itemError) {
                    return errorResponse('Error creating item', 500);
                  }
                }
              }
            }
          }
        } else {
          // Update existing phase
          await supabaseAdmin
            .from('phases')
            .update({
              title: phase.title,
              goal: phase.goal || '',
              sort_order: phase.sort_order || 0,
            })
            .eq('id', phase.id);
        }
      }
    }

    return Response.json({ message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/admin/plans/[id]:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    const planId = params.id;

    // Delete plan (cascade will delete related phases, days, items)
    const { error } = await supabaseAdmin
      .from('course_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      return errorResponse('Error deleting plan', 500);
    }

    return Response.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/plans/[id]:', error);
    return errorResponse('Internal server error', 500);
  }
}
