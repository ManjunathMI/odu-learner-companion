import 'server-only';
import { adminClient } from '@/lib/supabase/server';

type ManagedPath = { id: string; title: string; role: 'admin' | 'moderator' };

export async function listManagedPaths(userId: string): Promise<ManagedPath[]> {
  const { data, error } = await adminClient.from('path_memberships')
    .select('role,learning_paths!path_memberships_path_id_fkey!inner(id,title)')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .in('role', ['admin', 'moderator'])
    .overrideTypes<Array<{ role: ManagedPath['role']; learning_paths: { id: string; title: string } }>, { merge: false }>();

  if (error) throw new Error('Failed to load managed paths');
  return data.map(({ role, learning_paths }) => ({ ...learning_paths, role }))
    .sort((first, second) => first.title.localeCompare(second.title));
}

// Callers must verify the requested path and scope before using these service-role queries.
export async function readPathMembershipRows(pathId: string, pendingOnly = false) {
  let query = adminClient.from('path_memberships')
    .select('id,user_id,role,status,joined_at')
    .eq('path_id', pathId);
  if (pendingOnly) query = query.eq('status', 'pending');

  const { data, error } = await query.order('joined_at', { ascending: pendingOnly });
  if (error) throw new Error('Failed to load members');
  return data ?? [];
}

export async function apiMemberDirectory(pathId: string, pendingOnly = false) {
  const data = await readPathMembershipRows(pathId, pendingOnly);
  const userIds = data.map((member) => member.user_id);
  const { data: profiles, error: profileError } = userIds.length
    ? await adminClient.from('profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: [], error: null };

  if (profileError) throw new Error('Failed to load member profiles');

  const displayMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));

  return data.map((member) => ({
    ...member,
    display_name: displayMap.get(member.user_id) ?? null,
  }));
}
