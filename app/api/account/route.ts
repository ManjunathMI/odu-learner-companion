import { NextRequest } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();

  const [profileResult, membershipResult, entitlementResult] = await Promise.all([
    adminClient.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).maybeSingle(),
    adminClient.from('path_memberships').select('path_id, role, status, learning_paths(id, title, description, created_by)').eq('user_id', user.id).eq('status', 'approved').order('joined_at', { ascending: false }),
    adminClient.from('user_entitlements').select('max_created_paths').eq('user_id', user.id).maybeSingle(),
  ]);

  if (profileResult.error || membershipResult.error || entitlementResult.error) {
    return Response.json({ error: 'Failed to load account' }, { status: 500 });
  }

  const maxCreatedPaths = entitlementResult.data?.max_created_paths ?? 3;
  const { count: usage, error: usageError } = await adminClient
    .from('learning_paths')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id);
  if (usageError) return Response.json({ error: 'Failed to load creator usage' }, { status: 500 });

  const memberships = (membershipResult.data ?? []).map((membership) => ({
    pathId: membership.path_id,
    role: membership.role,
    path: membership.learning_paths,
  }));

  return Response.json({
    identity: {
      displayName: profileResult.data?.display_name ?? user.email?.split('@')[0] ?? 'Learner',
      avatarUrl: profileResult.data?.avatar_url ?? null,
      email: user.email ?? null,
    },
    isPlatformAdmin: await isPlatformAdmin(user.id),
    memberships,
    creator: {
      usage: usage ?? 0,
      maxCreatedPaths,
      remaining: Math.max(0, maxCreatedPaths - (usage ?? 0)),
    },
  });
}