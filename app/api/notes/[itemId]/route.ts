// app/api/notes/[itemId]/route.ts
import { NextRequest } from 'next/server';
import { getSession, errorResponse, supabaseAdmin } from '@/app/api/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const user = await getSession(req);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const itemId = params.itemId;

    if (!itemId) {
      return errorResponse('Item ID required', 400);
    }

    // Get notes for this item by this user, newest last
    const { data: notes, error } = await supabaseAdmin
      .from('notes')
      .select('id, note_text, created_at')
      .eq('item_id', itemId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      return errorResponse('Error fetching notes', 500);
    }

    return Response.json(notes || []);
  } catch (error) {
    console.error('Error in GET /api/notes/[itemId]:', error);
    return errorResponse('Internal server error', 500);
  }
}
