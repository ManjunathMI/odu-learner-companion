// app/api/feedback/route.ts
import { NextRequest } from 'next/request';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { message, content } = body;

    // Support both 'message' and 'content' field names
    const feedbackText = message || content;

    if (!feedbackText || typeof feedbackText !== 'string') {
      return errorResponse('Missing field: message or content (string)', 400);
    }

    if (feedbackText.trim().length === 0) {
      return errorResponse('Feedback cannot be empty', 400);
    }

    // Insert feedback
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: user.id,
        message: feedbackText.trim(),
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return errorResponse('Error saving feedback', 500);
    }

    return Response.json({ id: data?.[0]?.id || 'unknown', status: 'saved' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/feedback:', error);
    return errorResponse('Internal server error', 500);
  }
}
