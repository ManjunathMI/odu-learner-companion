import { after } from 'next/server';
import { getEmailSender, isNotificationEmailAddress } from '@/lib/notifications/email';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { validateFeedbackSubmission } from '@/lib/feedback-validation';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateFeedbackSubmission(body);
  if (!validation.value) return Response.json({ error: validation.error }, { status: 400 });

  const user = await getSession(request);
  const { data: id, error } = await adminClient.rpc('submit_feedback_request', {
    p_name: validation.value.name,
    p_email: validation.value.email,
    p_phone: validation.value.phone,
    p_request_type: validation.value.requestType,
    p_message: validation.value.message,
    p_user_id: user?.id ?? null,
  });

  if (error?.code === 'P0001' && error.message.includes('feedback_open_request_limit')) {
    return Response.json({ error: 'There are already two open requests for this email. Please wait for a reply before sending another.' }, { status: 429 });
  }
  if (error?.code === '22023') return Response.json({ error: 'Please check the form and remove markup before sending.' }, { status: 400 });
  if (error || !id) return Response.json({ error: 'Unable to send your message right now. Please try again.' }, { status: 500 });

  const adminEmail = process.env.NOTIFICATION_FEEDBACK_TO?.trim();
  const sender = user?.email_confirmed_at && adminEmail && isNotificationEmailAddress(adminEmail)
    ? getEmailSender('feedback')
    : null;
  if (sender && adminEmail) {
    after(async () => {
      const result = await sender.send({
        to: adminEmail,
        subject: 'New ODU feedback request',
        text: `A new request is available in Platform Admin → Feedback.\n\nRequest ID: ${id}`,
      }, `feedback-${id}`);
      if (result.status !== 'sent') console.warn('Feedback email notification', { id, status: result.status });
    });
  }

  return Response.json({ id, status: 'open' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}