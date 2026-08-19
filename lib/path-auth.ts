import 'server-only';
import { adminClient } from '@/lib/supabase/server';

export type PathRole = 'admin' | 'moderator' | 'learner';

export async function getMembership(userId: string, pathId: string) {
  const { data, error } = await adminClient
    .from('path_memberships')
    .select('id, user_id, path_id, role, status')
    .eq('user_id', userId)
    .eq('path_id', pathId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function requirePathMember(userId: string, pathId: string) {
  const membership = await getMembership(userId, pathId);
  return membership?.status === 'approved' ? membership : null;
}

export async function requirePathModerator(userId: string, pathId: string) {
  const membership = await requirePathMember(userId, pathId);
  return membership && (membership.role === 'admin' || membership.role === 'moderator')
    ? membership
    : null;
}

export async function requirePathAdmin(userId: string, pathId: string) {
  const membership = await requirePathMember(userId, pathId);
  return membership?.role === 'admin' ? membership : null;
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden(message = 'Access denied') {
  return Response.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Path not found') {
  return Response.json({ error: message }, { status: 404 });
}
