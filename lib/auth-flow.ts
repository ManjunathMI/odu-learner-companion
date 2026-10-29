// Shared by the email form, callback handler, and regression tests.
export function emailCallbackUrl(origin: string, next: string): string {
  const url = new URL('/auth/callback', origin);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid application origin');
  url.searchParams.set('next', next);
  return url.toString();
}

export function authCallbackInput(url: URL) {
  const code = url.searchParams.get('code');
  if (code) return { kind: 'code' as const, code };
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (tokenHash && (type === 'email' || type === 'magiclink' || type === 'signup')) {
    return { kind: 'token' as const, token_hash: tokenHash, type };
  }
  return { kind: 'invalid' as const };
}
