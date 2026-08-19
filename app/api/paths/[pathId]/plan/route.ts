import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathMember, requirePathAdmin, unauthorized, forbidden, notFound } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

async function readPlan(pathId: string) {
  const { data: phases, error } = await adminClient.from('phases').select('id, title, goal, sort_order').eq('path_id', pathId).order('sort_order');
  if (error) throw error;
  const result = [];
  for (const phase of phases || []) {
    const { data: days, error: dayError } = await adminClient.from('days').select('id, day_label, title, hours, sort_order').eq('phase_id', phase.id).order('sort_order');
    if (dayError) throw dayError;
    const daysWithItems = [];
    for (const day of days || []) {
      const { data: items, error: itemError } = await adminClient.from('lesson_items').select('id, title, url, tag, sort_order').eq('day_id', day.id).order('sort_order');
      if (itemError) throw itemError;
      daysWithItems.push({ id: day.id, dayLabel: day.day_label, title: day.title, hours: day.hours, items: items || [] });
    }
    result.push({ id: phase.id, title: phase.title, goal: phase.goal, days: daysWithItems });
  }
  return result;
}

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user || !(await requirePathMember(user.id, pathId))) return notFound();
  try { return Response.json({ phases: await readPlan(pathId) }); } catch { return Response.json({ error: 'Failed to load plan' }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathAdmin(user.id, pathId))) return forbidden('Admin access required');
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.phases)) return Response.json({ error: 'phases must be an array' }, { status: 400 });

  try {
    await adminClient.from('phases').delete().eq('path_id', pathId);
    for (let phaseIndex = 0; phaseIndex < body.phases.length; phaseIndex++) {
      const phase = body.phases[phaseIndex];
      const { data: newPhase, error: phaseError } = await adminClient.from('phases').insert({ path_id: pathId, title: String(phase.title || '').trim(), goal: phase.goal ? String(phase.goal).trim() : null, sort_order: phaseIndex }).select('id').single();
      if (phaseError || !newPhase) throw phaseError || new Error('phase insert failed');
      for (let dayIndex = 0; dayIndex < (Array.isArray(phase.days) ? phase.days.length : 0); dayIndex++) {
        const day = phase.days[dayIndex];
        const { data: newDay, error: dayError } = await adminClient.from('days').insert({ phase_id: newPhase.id, day_label: String(day.dayLabel || '').trim(), title: String(day.title || '').trim(), hours: day.hours == null ? null : String(day.hours), sort_order: dayIndex }).select('id').single();
        if (dayError || !newDay) throw dayError || new Error('day insert failed');
        const items = Array.isArray(day.items) ? day.items : [];
        if (items.length) {
          const { error: itemError } = await adminClient.from('lesson_items').insert(items.map((item: { title?: unknown; url?: unknown; tag?: unknown }, index: number) => ({ day_id: newDay.id, title: String(item.title || '').trim(), url: String(item.url || '').trim(), tag: item.tag === 'hands' || item.tag === 'exam' ? item.tag : null, sort_order: index })));
          if (itemError) throw itemError;
        }
      }
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('Replace plan error:', error);
    return Response.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}
