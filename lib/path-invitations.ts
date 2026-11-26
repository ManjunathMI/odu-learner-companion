import 'server-only';

import { createHash, createHmac, randomUUID } from 'node:crypto';
import { adminClient } from '@/lib/supabase/server';
import { getEmailSender } from '@/lib/notifications/email';
import { pathInvitationMessage } from '@/lib/path-invitation-message';

type Reservation =
  | { status: 'reserved'; deliveryId: string; recipient: string; title: string; description: string | null }
  | { status: 'unavailable' | 'duplicate' | 'rate_limited' | 'reminder_limited' };

export const invitationHash = (token: string) => createHash('sha256').update(token).digest('hex');

export function configuredInvitations() {
  const sender = getEmailSender('invitations');
  const secret = process.env.PATH_INVITATION_SECRET?.trim();
  try {
    const base = new URL(process.env.NEXT_PUBLIC_BASE_URL ?? '');
    if (!sender || !secret || secret.length < 32 || !['http:', 'https:'].includes(base.protocol)
      || base.username || base.password) return null;
    return { sender, secret, origin: base.origin };
  } catch {
    return null;
  }
}

export async function deliverPathInvitation(config: NonNullable<ReturnType<typeof configuredInvitations>>, request: {
  senderId: string;
  senderEmail: string;
  pathId?: string;
  recipient?: string;
  reminderFor?: string;
}) {
  const invitationId = request.reminderFor ?? randomUUID();
  const signature = createHmac('sha256', config.secret).update(invitationId).digest('hex');
  const token = `${invitationId}.${signature}`;
  const { data, error } = await adminClient.rpc('reserve_path_invitation_delivery', {
    p_sender: request.senderId,
    p_sender_email: request.senderEmail,
    p_path: request.pathId ?? null,
    p_invitation: invitationId,
    p_recipient: request.recipient ?? null,
    p_token_hash: invitationHash(token),
    p_provider: config.sender.provider,
    p_reminder: Boolean(request.reminderFor),
  });
  if (error || !data) return 'failed' as const;
  const reservation = data as Reservation;
  if (reservation.status !== 'reserved') return reservation.status;

  const link = new URL(`/invitations/accept/${token}`, config.origin).href;
  const message = pathInvitationMessage(reservation.title, reservation.description, link, Boolean(request.reminderFor));
  const result = await config.sender.send({ ...message, to: reservation.recipient }, reservation.deliveryId);
  const { error: updateError } = await adminClient.from('path_invitation_deliveries')
    .update({
      status: result.status,
      provider_message_id: result.status === 'sent' ? result.providerMessageId : null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', reservation.deliveryId)
    .eq('status', 'reserved');

  return updateError ? 'unknown' : result.status;
}
