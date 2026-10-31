import { NextRequest } from 'next/server';
import { getSession, requirePlatformOwner } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { forbidden, unauthorized } from '@/lib/path-auth';

export async function GET(request: NextRequest) {
  const user = await getSession(request);
  if (!user) return unauthorized();
  if (!(await requirePlatformOwner(user))) return forbidden('Platform owner access required');

  const { data, error } = await adminClient
    .from('feedback_requests')
    .select('id, user_id, name, email, phone, request_type, message, status, response_text, responded_by, responded_at, created_at, updated_at')
    .order('request_type', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) return Response.json({ error: 'Unable to load feedback requests' }, { status: 500 });
  return Response.json(data ?? [], { headers: { 'Cache-Control': 'no-store' } });
}