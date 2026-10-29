// Restrict sign-in continuations to supported internal learner destinations.
export function returnDestination(value: string | null): string {
  if (value === '/admin') return '/admin';
  return value && /^\/paths\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : '/journey';
}
