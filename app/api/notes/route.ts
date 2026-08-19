// app/api/notes/route.ts
import { NextRequest } from 'next/server';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { itemId, text } = body;

    if (!itemId || !text) {
      return errorResponse('Missing fields: itemId (uuid), text (string)', 400);
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return errorResponse('Note text cannot be empty', 400);
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

    // Insert note
    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        item_id: itemId,
        user_id: user.id,
        note_text: text.trim(),
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Insert error:', error);
      return errorResponse('Error saving note', 500);
    }

    return Response.json(data?.[0] || { id: 'unknown' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    return errorResponse('Internal server error', 500);
  }
}
