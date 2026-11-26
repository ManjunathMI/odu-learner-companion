import 'server-only';
import { isOwnerIdentity } from '@/lib/platform-owner';
import { createClient, adminClient } from '@/lib/supabase/server';

export async function getAccountSuspension(userId: string) {
  const { data, error } = await adminClient.from('account_suspension_events')
    .select('suspended, reason, created_at').eq('user_id', userId).order('id', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Unable to verify account access');
  return data;
}

export async function getSessionStatus(req: Request) {
  const authorization = req.headers.get('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (token === '') return { status: 'unauthenticated' } as const;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { status: 'unauthenticated' } as const;

  try {
    if ((await getAccountSuspension(data.user.id))?.suspended) {
      return { status: 'suspended' } as const;
    }
  } catch {
    return { status: 'unavailable' } as const;
  }

  return { status: 'active', user: data.user } as const;
}

// Existing API callers treat any session that cannot be authorized as absent.
export async function getSession(req: Request) {
  const session = await getSessionStatus(req);
  return session.status === 'active' ? session.user : null;
}

/**
 * True if the given userId belongs to a platform admin.
 * Checked against the platform_admins table via the admin client so RLS
 * (which has zero policies on that table) never blocks the lookup.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && data !== null;
}

export async function requirePlatformAdmin(userId: string): Promise<boolean> {
  return isPlatformAdmin(userId);
}

export async function requirePlatformOwner(user: { id: string; email?: string | null }): Promise<boolean> {
  return isOwnerIdentity(user) && await isPlatformAdmin(user.id);
}
