import 'server-only';
import { createClient, adminClient } from '@/lib/supabase/server';

/**
 * Resolves the caller's session from two sources, in priority order:
 *   1. Bearer token in the Authorization header  (React Native / API clients)
 *   2. Supabase SSR cookie session               (Next.js web browser)
 *
 * Returning null means the caller is unauthenticated — route handlers should
 * respond with 401.
 */
export async function getSession(req: Request) {
  // ── 1. Bearer token (works for both web API calls and future React Native) ──
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return data.user;
  }

  // ── 2. Cookie session (server-rendered Next.js pages) ──
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) return data.user;

  return null;
}

/**
 * True if the given userId belongs to a platform admin.
 * Checked against the platform_admins table via the admin client so RLS
 * (which has zero policies on that table) never blocks the lookup.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data !== null;
}
