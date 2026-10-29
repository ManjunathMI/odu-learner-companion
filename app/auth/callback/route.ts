import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { returnDestination } from '@/lib/return-destination';
import { authCallbackInput } from '@/lib/auth-flow';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = returnDestination(url.searchParams.get('next'));
  const input = authCallbackInput(url);
  let success = false;
  try {
    if (input.kind !== 'invalid') {
      const supabase = await createClient();
      const { error } = input.kind === 'code'
        ? await supabase.auth.exchangeCodeForSession(input.code)
        : await supabase.auth.verifyOtp({ token_hash: input.token_hash, type: input.type });
      success = !error;
    }
  } catch {
    // Never include codes, token hashes, or upstream auth messages in logs/URLs.
  }
  const destination = new URL(success ? next : '/auth', url.origin);
  if (!success) {
    destination.searchParams.set('error', 'link');
    destination.searchParams.set('next', next);
  }
  const response = NextResponse.redirect(destination, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
