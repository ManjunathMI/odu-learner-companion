// app/api/progress/route.ts
import { NextRequest } from 'next/server';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { itemId, done } = body;

    if (!itemId || typeof done !== 'boolean') {
      return errorResponse('Missing or invalid fields: itemId (uuid), done (boolean)', 400);
    }

    // Verify item exists
    const { data: item, error: itemError } = await supabaseAdmin
      .from('lesson_items')
      .select('id')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return errorResponse('Item not found', 404);
    }

    // Upsert progress
    const { data, error } = await supabaseAdmin
      .from('progress')
      .upsert(
        {
          user_id: user.id,
          item_id: itemId,
          done: done,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, item_id' }
      )
      .select();

    if (error) {
      console.error('Upsert error:', error);
      return errorResponse('Error saving progress', 500);
    }

    return Response.json(data?.[0] || { done });
  } catch (error) {
    console.error('Error in POST /api/progress:', error);
    return errorResponse('Internal server error', 500);
  }
}
