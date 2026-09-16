import type { MetadataRoute } from 'next';
import { adminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

const STATIC_PUBLIC_ROUTES = [
  '',
  '/explore',
  '/docs',
  '/docs/business-guide',
  '/docs/architecture',
  '/docs/roadmap',
  '/docs/database-operations',
  '/docs/development',
  '/docs/api',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
  }));

  try {
    const { data: paths, error } = await adminClient
      .from('learning_paths')
      .select('id, updated_at')
      .eq('visibility', 'public')
      .eq('wall_status', 'approved')
      .order('updated_at', { ascending: false });

    if (error || !paths) {
      return staticEntries;
    }

    const dynamicEntries: MetadataRoute.Sitemap = paths.map((path) => ({
      url: `${baseUrl}/paths/${path.id}`,
      lastModified: path.updated_at ? new Date(path.updated_at) : undefined,
    }));

    return [...staticEntries, ...dynamicEntries];
  } catch {
    // If Supabase is unreachable, return static routes gracefully
    return staticEntries;
  }
}
