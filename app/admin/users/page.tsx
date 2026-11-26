import Link from 'next/link';
import { adminClient, createClient } from '@/lib/supabase/server';
import { requirePlatformOwner } from '@/lib/auth';
import { notFound } from 'next/navigation';
import styles from '@/components/management/management.module.css';
import { loadDirectoryQuotas } from '@/lib/creator-quota';
import UserDirectory from '@/components/management/UserDirectory';
import { PLATFORM_OWNER_ID } from '@/lib/platform-owner';

export default async function UsersPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await requirePlatformOwner(user))) notFound();

  const requestedPage = Number((await searchParams).page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 50 });

  const quotas = error ? null : await loadDirectoryQuotas(data.users.map(account => account.id));

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/admin">Platform Admin</Link><span aria-hidden="true">›</span><span aria-current="page">User Management</span></nav>
      <header className={styles.heading}>
        <h1>User Management</h1>
        <Link className="button-secondary" href="/admin/qa-accounts">QA Accounts</Link>
      </header>
      {error ? <p role="alert">Unable to load accounts.</p> : (
        <>
          {data.users.length === 0 ? <p>No accounts on this page.</p> : (
            <UserDirectory key={page} accounts={data.users.map(account => ({
              id: account.id,
              quota: quotas?.get(account.id) ?? null,
              name: account.email ?? account.id,
              type: account.id === PLATFORM_OWNER_ID ? 'Platform owner' : account.app_metadata.role === 'test' ? 'QA account' : 'User',
              lastSignIn: account.last_sign_in_at ?? null,
              lastSignInLabel: account.last_sign_in_at ? new Date(account.last_sign_in_at).toLocaleDateString() : 'Never',
              created: account.created_at,
              createdLabel: new Date(account.created_at).toLocaleDateString(),
            }))} />
          )}
          <nav className={styles.pager} aria-label="User pages">
            <span>Page {page}</span>
            {page > 1 && <Link className="button-secondary" href={`/admin/users?page=${page - 1}`}>Previous</Link>}
            {data.nextPage != null && <Link className="button-secondary" href={`/admin/users?page=${data.nextPage}`}>Next</Link>}
          </nav>
        </>
      )}
    </>
  );
}
