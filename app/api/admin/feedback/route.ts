// app/api/admin/feedback/route.ts
import { NextRequest } from 'next/server';
import { getSession, isAdmin, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (!isAdmin(user.id)) {
      return errorResponse('Forbidden', 403);
    }

    // Get all feedback, newest first, with user email
    const { data: feedback, error } = await supabaseAdmin
      .from('feedback')
      .select(`
        id,
        message,
        created_at,
        user_id,
        user:auth.users(email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Query error:', error);
      return errorResponse('Error fetching feedback', 500);
    }

    // Format response
    const formattedFeedback = (feedback || []).map((item: any) => ({
      id: item.id,
      message: item.message,
      userEmail: item.user?.[0]?.email || 'unknown',
      userId: item.user_id,
      createdAt: item.created_at,
    }));

    return Response.json(formattedFeedback);
  } catch (error) {
    console.error('Error in GET /api/admin/feedback:', error);
    return errorResponse('Internal server error', 500);
  }
}
