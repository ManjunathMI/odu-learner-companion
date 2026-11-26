import { createHash } from 'node:crypto';
import { getEmailSender, isNotificationEmailAddress } from '@/lib/notifications/email';
import { NextRequest } from 'next/server';
import { getSession, requirePlatformOwner } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { validateFeedbackResponse } from '@/lib/feedback-validation';
import { badRequest, forbidden, notFound, unauthorized } from '@/lib/path-auth';

type Context = { params: Promise<{ requestId: string }> };
const statuses = ['open', 'in_progress', 'answered', 'closed'] as const;

export async function PATCH(request: NextRequest, { params }: Context) {
  const { requestId } = await params;
  const user = await getSession(request);
  if (!user) return unauthorized();
  if (!(await requirePlatformOwner(user))) return forbidden('Platform owner access required');

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !statuses.includes(body.status)) {
    return badRequest('Choose a valid request status');
  }

  const { data: current, error: currentError } = await adminClient
    .from('feedback_requests')
    .select('id, email, response_text, status, updated_at')
    .eq('id', requestId)
    .maybeSingle();
  if (currentError) return Response.json({ error: 'Unable to load feedback request' }, { status: 500 });
  if (!current) return notFound('Feedback request not found');

  const responseText = body.responseText === undefined
    ? undefined
    : validateFeedbackResponse(body.responseText);
  if (body.responseText !== undefined && !responseText) {
    return badRequest('Write a plain-text response of up to 5,000 characters');
  }
  if (responseText && body.status !== 'answered') {
    return badRequest('Mark the request answered when recording a reply you have sent');
  }
  if (body.status === 'answered' && !responseText && !current.response_text) {
    return badRequest('Record the response before marking this request answered');
  }

  const sendReply = body.sendReply === true;
  let expectedVersion: string | undefined;
  if (sendReply) {
    if (!responseText) return badRequest('Write a reply before sending');
    if (current.status === 'closed' || responseText === current.response_text) {
      return badRequest('Reopen a closed request or write a new reply before sending');
    }
    if (!isNotificationEmailAddress(current.email)) return badRequest('The request has no valid reply email address');
    const sender = getEmailSender('feedback');
    if (!sender) return Response.json({ error: 'Feedback email is unavailable. Your reply has not been sent.' }, { status: 503 });

    if (body.version !== current.updated_at) {
      return Response.json({ error: 'The request changed. Refresh before sending.' }, { status: 409 });
    }
    // Reserve this version before SMTP so two copies of the same form cannot both send.
    const { data: reservation, error: reservationError } = await adminClient
      .from('feedback_requests').update({ updated_at: new Date(Math.max(Date.now(), Date.parse(current.updated_at) + 1)).toISOString() })
      .eq('id', requestId).eq('updated_at', current.updated_at).select('updated_at').maybeSingle();
    if (reservationError) return Response.json({ error: 'Unable to prepare the reply. No email was sent.' }, { status: 500 });
    if (!reservation) return Response.json({ error: 'The request changed. Refresh before sending.' }, { status: 409 });
    expectedVersion = reservation.updated_at;

    const key = createHash('sha256').update(responseText).digest('hex');
    const delivery = await sender.send({
      to: current.email,
      subject: 'Reply to your ODU feedback or help request',
      text: responseText,
    }, `feedback-reply-${requestId}-${key}`);
    if (delivery.status !== 'sent') {
      return Response.json({
        error: delivery.status === 'unknown'
          ? 'Email delivery is unconfirmed. Check your mail provider before sending again.'
          : 'The mail provider rejected the reply. The response was not recorded. Refresh before trying again.',
      }, { status: 502 });
    }
  }

  const update: {
    status: (typeof statuses)[number];
    updated_at: string;
    response_text?: string;
    responded_at?: string;
    responded_by?: string;
  } = { status: body.status, updated_at: new Date().toISOString() };

  if (responseText && body.status === 'answered') {
    update.response_text = responseText;
    update.responded_at = new Date().toISOString();
    update.responded_by = user.id;
  }

  let query = adminClient.from('feedback_requests').update(update).eq('id', requestId);
  if (expectedVersion) query = query.eq('updated_at', expectedVersion);
  const { data, error } = await query
    .select('id, status, response_text, responded_by, responded_at, updated_at')
    .maybeSingle();
  if (sendReply && (error || !data)) {
    return Response.json({ error: 'The email was accepted for delivery, but the response could not be saved. Use Save status / response to record it without resending.' }, { status: 500 });
  }
  if (error) return Response.json({ error: 'Unable to save feedback response' }, { status: 500 });
  if (!data) return notFound('Feedback request not found');

  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
