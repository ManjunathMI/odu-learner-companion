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
    .select('id, response_text')
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

  const { data, error } = await adminClient
    .from('feedback_requests')
    .update(update)
    .eq('id', requestId)
    .select('id, status, response_text, responded_by, responded_at, updated_at')
    .maybeSingle();
  if (error) return Response.json({ error: 'Unable to save feedback response' }, { status: 500 });
  if (!data) return notFound('Feedback request not found');

  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}