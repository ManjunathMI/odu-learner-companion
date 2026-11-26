import { NextRequest } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { loadCreatorQuota } from '@/lib/creator-quota';
import { unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();

  const [profileResult, membershipResult, quota] = await Promise.all([
    adminClient.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).maybeSingle(),
    adminClient.from('path_memberships').select('path_id, role, status, learning_paths(id, title, description, created_by)').eq('user_id', user.id).eq('status', 'approved').order('joined_at', { ascending: false }),
    loadCreatorQuota(user.id),
  ]);

  if (profileResult.error || membershipResult.error || !quota) {
    return Response.json({ error: 'Failed to load account' }, { status: 500 });
  }

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
      usage: quota.usage,
      maxCreatedPaths: quota.limit,
      remaining: Math.max(0, quota.limit - quota.usage),
    },
  });
}