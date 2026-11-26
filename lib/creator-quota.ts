import 'server-only';

import { DEFAULT_PATH_LIMIT } from '@/lib/creator-limits';
import { adminClient } from '@/lib/supabase/server';

export async function loadCreatorQuota(userId: string) {
  const [entitlement, paths] = await Promise.all([
    adminClient.from('user_entitlements').select('max_created_paths').eq('user_id', userId).maybeSingle(),
    adminClient.from('learning_paths').select('id', { count: 'exact', head: true }).eq('created_by', userId),
  ]);
  if (entitlement.error || paths.error || paths.count === null) return null;
  const limit = entitlement.data?.max_created_paths ?? DEFAULT_PATH_LIMIT;
  return { usage: paths.count, limit };
}

export async function loadDirectoryQuotas(userIds: string[]) {
  const quotas = new Map(userIds.map(id => [id, { usage: 0, limit: DEFAULT_PATH_LIMIT }]));
  if (userIds.length === 0) return quotas;

  const pageSize = 500;
  const pathQuery = (offset: number) => adminClient.from('learning_paths')
    .select('id,created_by', { count: 'exact' }).in('created_by', userIds).order('id')
    .range(offset, offset + pageSize - 1);
  const [entitlements, initialPaths] = await Promise.all([
    adminClient.from('user_entitlements').select('user_id,max_created_paths').in('user_id', userIds),
    pathQuery(0),
  ]);
  if (entitlements.error) return null;
  for (const row of entitlements.data) quotas.get(row.user_id)!.limit = row.max_created_paths;

  let batch = initialPaths;
  let offset = 0;
  while (true) {
    if (batch.error || batch.count === null) return null;
    for (const row of batch.data) quotas.get(row.created_by)!.usage++;
    offset += batch.data.length;
    if (!batch.data.length || offset >= batch.count) break;
    batch = await pathQuery(offset);
  }
  return quotas;
}
