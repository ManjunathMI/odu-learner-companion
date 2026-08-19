import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { requirePathMember, unauthorized, forbidden } from '@/lib/path-auth';

type Context = { params: Promise<{ pathId: string }> };

export async function GET(req: NextRequest, { params }: Context) {
  const { pathId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePathMember(user.id, pathId))) return forbidden('Approved membership required');

  const { data: members, error: memberError } = await adminClient.from('path_memberships').select('user_id').eq('path_id', pathId).eq('status', 'approved');
  const { data: phases, error: phaseError } = await adminClient.from('phases').select('id').eq('path_id', pathId);
  if (memberError || phaseError) return Response.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  const phaseIds = (phases || []).map((phase) => phase.id);
  const { data: days } = phaseIds.length ? await adminClient.from('days').select('id').in('phase_id', phaseIds) : { data: [] };
  const dayIds = (days || []).map((day) => day.id);
  const { data: items } = dayIds.length ? await adminClient.from('lesson_items').select('id').in('day_id', dayIds) : { data: [] };
  const total = items?.length || 0;
  const itemIds = new Set((items || []).map((item) => item.id));
  const userIds = (members || []).map((member) => member.user_id);
  const { data: progress } = userIds.length ? await adminClient.from('progress').select('user_id, item_key').eq('path_id', pathId).eq('done', true).in('user_id', userIds) : { data: [] };
  const { data: profiles } = userIds.length ? await adminClient.from('profiles').select('user_id, display_name').in('user_id', userIds) : { data: [] };
  const names = new Map((profiles || []).map((profile) => [profile.user_id, profile.display_name]));
  const counts = new Map<string, number>();
  for (const row of progress || []) if (itemIds.has(row.item_key)) counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1);
  const leaderboard = userIds.map((userId) => ({ userId, displayName: names.get(userId) || 'Learner', doneCount: counts.get(userId) || 0, total }));
  leaderboard.sort((a, b) => b.doneCount - a.doneCount);
  return Response.json(leaderboard);
}
