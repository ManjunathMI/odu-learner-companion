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

  return Response.json({ id, status: 'open' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}