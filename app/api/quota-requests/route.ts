import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { badRequest, unauthorized } from '@/lib/path-auth';

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();
  const { data, error } = await adminClient.from('quota_requests').select('id, current_limit, requested_limit, reason, status, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return Response.json({ error: 'Failed to load quota requests' }, { status: 500 });
  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const requestedLimit = Number(body.requested_limit);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return badRequest('requested_limit must be a positive integer');

  const { data: entitlement, error: entitlementError } = await adminClient.from('user_entitlements').upsert({ user_id: user.id }, { onConflict: 'user_id' }).select('max_created_paths').single();
  if (entitlementError) return Response.json({ error: 'Failed to load creator entitlement' }, { status: 500 });
  if (requestedLimit <= entitlement.max_created_paths) return badRequest('requested_limit must be greater than your current limit');

  const { data, error } = await adminClient.from('quota_requests').insert({ user_id: user.id, current_limit: entitlement.max_created_paths, requested_limit: requestedLimit, reason: typeof body.reason === 'string' ? body.reason.trim() || null : null }).select('id, current_limit, requested_limit, reason, status, created_at').single();
  if (error) {
    if (error.code === '23505') return Response.json({ error: 'You already have a pending quota request.' }, { status: 409 });
    return Response.json({ error: 'Failed to create quota request' }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}