import 'server-only';

import { adminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export type InvitationRow = Database['public']['Views']['path_invitation_status']['Row'];
export const invitationStatuses: Record<InvitationRow['status'], string> = {
  sent: 'Sent', failed: 'Send failed', unconfirmed: 'Send unconfirmed', accepted: 'Accepted',
  join_pending: 'Join pending', joined: 'Joined', join_declined: 'Join declined', expired: 'Expired',
};

export async function loadInvitationTotals(senderId: string | null) {
  const { data, error } = await adminClient.rpc('path_invitation_totals', { p_sender: senderId });
  return error ? null : data as { sent: number; reminders: number; accepted: number; joined: number };
}

export async function loadInvitationPage(senderId: string | null, page: number, status?: InvitationRow['status'], recipient?: string) {
  const pageSize = 25;
  let query = adminClient.from('path_invitation_status').select('*');
  if (senderId) query = query.eq('sender_id', senderId);
  if (status) query = query.eq('status', status);
  if (recipient) query = query.ilike('recipient_email', `%${recipient.replace(/[\\%_]/g, '\\$&')}%`);

  const start = (page - 1) * pageSize;
  const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(start, start + pageSize);
  if (error) return null;

  const rows = data.slice(0, pageSize);
  const history = rows.length ? await adminClient.from('path_invitation_deliveries')
    .select('id,invitation_id,kind,status,created_at').in('invitation_id', rows.map(row => row.id))
    .order('created_at', { ascending: false }) : null;

  return { rows, hasNext: data.length > pageSize, history: history?.error ? null : history?.data ?? [] };
}
