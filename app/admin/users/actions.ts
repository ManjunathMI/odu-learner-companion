'use server';

import { getAccountSuspension, requirePlatformOwner } from '@/lib/auth';
import { loadInvitationTotals } from '@/lib/invitation-directory';
import { MAX_PATH_LIMIT } from '@/lib/creator-limits';
import { PLATFORM_OWNER_ID } from '@/lib/platform-owner';
import { adminClient, createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { notFound } from 'next/navigation';

type Membership = Database['public']['Tables']['path_memberships']['Row'];
type AuditEvent = Pick<Database['public']['Tables']['account_suspension_events']['Row'], 'id' | 'suspended' | 'reason' | 'created_at'>;
type AccessResult = { message: string; error: boolean; suspended?: boolean; event?: AuditEvent };

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await requirePlatformOwner(user))) notFound();
  return user;
}

export async function loadUserDetails(userId: string) {
  await requireOwner();

  const [paths, memberships, audit, invitations] = await Promise.all([
    adminClient.from('learning_paths').select('id,title').eq('created_by', userId).order('title'),
    adminClient.from('path_memberships')
      .select('id,path_id,role,status,joined_at,learning_paths!path_memberships_path_id_fkey!inner(title)')
      .eq('user_id', userId).order('joined_at', { ascending: false })
      .overrideTypes<Array<Pick<Membership, 'id' | 'path_id' | 'role' | 'status' | 'joined_at'> & { learning_paths: { title: string } }>, { merge: false }>(),
    adminClient.from('account_suspension_events').select('id,suspended,reason,created_at')
      .eq('user_id', userId).order('id', { ascending: false }).limit(20),
    loadInvitationTotals(userId),
  ]);

  return { paths: paths.data, memberships: memberships.data, audit: audit.data, invitations };
}

export async function changeAccountAccess(userId: string, form: FormData): Promise<AccessResult> {
  const user = await requireOwner();
  if (userId === user.id || userId === PLATFORM_OWNER_ID) notFound();

  const intent = form.get('intent');
  const reason = form.get('reason');
  if ((intent !== 'suspend' && intent !== 'restore') || typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) {
    return { message: 'Select an access change and enter a reason of up to 500 characters.', error: true };
  }

  const { data: target, error: targetError } = await adminClient.auth.admin.getUserById(userId);
  if (targetError || !target.user || target.user.app_metadata.role === 'test') notFound();

  const suspended = intent === 'suspend';
  let previous;
  try {
    previous = await getAccountSuspension(userId);
  } catch {
    return { message: 'Unable to verify current account access.', error: true };
  }
  const message = suspended ? 'Account suspended.' : 'Account access restored.';
  if (Boolean(previous?.suspended) === suspended) return { message, error: false, suspended };

  const { data: event, error } = await adminClient.from('account_suspension_events').insert({
    user_id: userId,
    actor_id: user.id,
    suspended,
    reason: reason.trim(),
  }).select('id,suspended,reason,created_at').single();
  if (error) return { message: 'Unable to update account access.', error: true };
  return { message, error: false, suspended, event };
}

export async function changePathLimit(userId: string, form: FormData) {
  const owner = await requireOwner();
  const input = form.get('pathLimit');
  const limit = typeof input === 'string' && input.trim() !== '' ? Number(input) : NaN;
  if (!Number.isInteger(limit) || limit < 0 || limit > MAX_PATH_LIMIT) {
    return { error: 'Enter a whole path limit of zero or greater.' };
  }

  const { error } = await adminClient.from('user_entitlements').upsert({
    user_id: userId,
    max_created_paths: limit,
    updated_by: owner.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return { error: 'Unable to update path limit.' };
  return { limit };
}
