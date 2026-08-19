import { createClient } from '@/lib/supabase/client';

// Thin fetch wrapper that injects the Supabase Bearer token automatically.
// Identical call signature works in React Native — only the base URL changes.

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(extraHeaders as HeadersInit),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}
