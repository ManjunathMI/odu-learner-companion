import { getSession } from '@/lib/auth';
import { badRequest, forbidden, unauthorized } from '@/lib/path-auth';
import { configuredInvitations, deliverPathInvitation } from '@/lib/path-invitations';
import { isNotificationEmailAddress } from '@/lib/notifications/email';
import { isUuid } from '@/lib/return-destination';

export async function POST(request: Request, { params }: { params: Promise<{ pathId: string }> }) {
  const user = await getSession(request);
  if (!user) return unauthorized();
  if (!user.email || !user.email_confirmed_at) return forbidden('Confirm your email before sending invitations.');
  const { pathId } = await params;
  if (!isUuid(pathId)) return badRequest('Invalid path.');

  const body = await request.json().catch(() => null);
  if (typeof body?.recipients !== 'string' || body.recipients.length > 1300) return badRequest('Enter up to five email addresses.');
  const recipients = [...new Set<string>(body.recipients.split(',').map((entry: string) => entry.trim().toLowerCase()))];
  if (!recipients.length || recipients.length > 5 || recipients.some(email => !isNotificationEmailAddress(email))) {
    return badRequest('Enter up to five valid, comma-separated email addresses.');
  }

  const config = configuredInvitations();
  if (!config) return Response.json({ error: 'Email sending is unavailable. You can still copy the path link.' }, { status: 503 });

  const senderEmail = user.email.toLowerCase();
  const results = await Promise.all(recipients.map(async recipient => ({
    recipient,
    status: await deliverPathInvitation(config, { senderId: user.id, senderEmail, pathId, recipient }),
  })));
  return Response.json({ results });
}
