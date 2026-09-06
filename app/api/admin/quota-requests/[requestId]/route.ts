import { NextRequest } from 'next/server';
import { getSession, requirePlatformAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { badRequest, forbidden, notFound, unauthorized } from '@/lib/path-auth';

type Context = { params: Promise<{ requestId: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const { requestId } = await params;
  const user = await getSession(req);
  if (!user) return unauthorized();
  if (!(await requirePlatformAdmin(user.id))) return forbidden('Platform admin access required');
  const body = await req.json().catch(() => ({}));
  const decision = body.decision;
  if (decision !== 'approved' && decision !== 'rejected') return badRequest('decision must be approved or rejected');

  const { data: request, error: requestError } = await adminClient.from('quota_requests').select('id, user_id, requested_limit, status').eq('id', requestId).maybeSingle();
  if (requestError) return Response.json({ error: 'Failed to load quota request' }, { status: 500 });
  if (!request) return notFound('Quota request not found');
  if (request.status !== 'pending') return badRequest('Quota request has already been reviewed');

  const { data, error } = await adminClient.rpc('review_quota_request', {
    p_request_id: requestId,
    p_decision: decision,
    p_reviewer: user.id,
  });
  if (error) {
    if (error.code === 'P0002') return notFound('Quota request not found');
    if (error.code === '23514') return badRequest('Quota request has already been reviewed');
    return Response.json({ error: 'Failed to review quota request' }, { status: 500 });
  }
  return Response.json({ id: data.id, status: data.status, reviewed_at: data.reviewed_at });
}