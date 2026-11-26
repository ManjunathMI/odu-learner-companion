import { getSession } from '@/lib/auth';
import { forbidden, notFound, unauthorized } from '@/lib/path-auth';
import { configuredInvitations, deliverPathInvitation } from '@/lib/path-invitations';
import { isUuid } from '@/lib/return-destination';

export async function POST(request: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  const user = await getSession(request);
  if (!user) return unauthorized();
  if (!user.email || !user.email_confirmed_at) return forbidden('Confirm your email before sending reminders.');
  const { invitationId } = await params;
  if (!isUuid(invitationId)) return notFound('Invitation not found.');
  const config = configuredInvitations();
  if (!config) return Response.json({ error: 'Email sending is unavailable.' }, { status: 503 });

  const status = await deliverPathInvitation(config, {
    senderId: user.id,
    senderEmail: user.email.toLowerCase(),
    reminderFor: invitationId.toLowerCase(),
  });
  if (status === 'unavailable') return notFound('Invitation no longer available for reminders.');
  if (status === 'reminder_limited' || status === 'rate_limited') {
    return Response.json({ error: 'Reminder or sending limit reached. Try again later.' }, { status: 429 });
  }
  return Response.json({ status });
}
