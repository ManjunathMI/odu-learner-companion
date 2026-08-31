import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { unauthorized } from '@/lib/path-auth';

function normalizeLinks(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function sanitizeVisibility(value: unknown): 'joined_paths_only' | 'public' {
  return value === 'public' ? 'public' : 'joined_paths_only';
}

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();

  try {
    const { data, error } = await adminClient
      .from('profiles')
      .select('user_id, display_name, avatar_url, bio, social_links, repo_links, profile_visibility, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const fallbackName = user.email?.split('@')[0] || 'Learner';
      const { data: created, error: createError } = await adminClient
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: fallbackName,
          avatar_url: null,
          bio: null,
          social_links: [],
          repo_links: [],
          profile_visibility: 'joined_paths_only',
        }, { onConflict: 'user_id' })
        .select('user_id, display_name, avatar_url, bio, social_links, repo_links, profile_visibility, updated_at')
        .single();

      if (createError) throw createError;
      return Response.json(created ?? {
        user_id: user.id,
        display_name: fallbackName,
        avatar_url: null,
        bio: null,
        social_links: [],
        repo_links: [],
        profile_visibility: 'joined_paths_only',
        updated_at: new Date().toISOString(),
      });
    }

    return Response.json({
      user_id: data.user_id,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      social_links: normalizeLinks(data.social_links),
      repo_links: normalizeLinks(data.repo_links),
      profile_visibility: data.profile_visibility,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error('Profile load error:', error);
    return Response.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const payload = {
      user_id: user.id,
      display_name: String(body.display_name ?? '').trim() || user.email?.split('@')[0] || 'Learner',
      avatar_url: typeof body.avatar_url === 'string' ? body.avatar_url.trim() || null : null,
      bio: typeof body.bio === 'string' ? body.bio.trim() || null : null,
      social_links: normalizeLinks(body.social_links),
      repo_links: normalizeLinks(body.repo_links),
      profile_visibility: sanitizeVisibility(body.profile_visibility),
    };

    const { data, error } = await adminClient
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, display_name, avatar_url, bio, social_links, repo_links, profile_visibility, updated_at')
      .single();

    if (error) throw error;

    return Response.json({
      user_id: data.user_id,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      social_links: normalizeLinks(data.social_links),
      repo_links: normalizeLinks(data.repo_links),
      profile_visibility: data.profile_visibility,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error('Profile save error:', error);
    return Response.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
