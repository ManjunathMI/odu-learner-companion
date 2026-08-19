// app/api/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Admin client with service role key (for admin operations only)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get user from request Authorization header
export async function getSession(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.error('Auth error:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

// Check if user is admin
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;

  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
  return adminIds.includes(userId);
}

// Helper to get Supabase client for reading with user session
export function getSupabaseClient(token?: string) {
  if (token) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Error response helper
export function errorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

// Success response helper
export function successResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}
