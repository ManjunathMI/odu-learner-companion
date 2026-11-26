import Link from 'next/link';
import MemberEditor from '@/components/management/MemberEditor';
import styles from '@/components/management/management.module.css';
import { redirect } from 'next/navigation';
import { apiMemberDirectory, listManagedPaths } from '@/lib/path-member-directory';
import { isPlatformAdmin } from '@/lib/auth';
import { pathMembersDestination } from '@/lib/return-destination';
import { adminClient, createClient } from '@/lib/supabase/server';

export default async function MyPathMembers({ searchParams }: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  const destination = typeof path === 'string' ? pathMembersDestination(path) : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(destination ?? '/account/path-members')}`);

  const paths = await listManagedPaths(user.id);
  const pathId = destination ? path?.toLowerCase() : undefined;
  let selected = path === undefined ? paths[0] : paths.find(item => item.id === pathId);

  // An explicit link may point to a path managed through the platform override.
  if (!selected && pathId && await isPlatformAdmin(user.id)) {
    const { data, error } = await adminClient.from('learning_paths').select('id,title').eq('id', pathId).maybeSingle();
    if (error) throw new Error('Failed to load path');
    if (data) selected = { ...data, role: 'admin' };
  }

  const members = selected ? await apiMemberDirectory(selected.id, selected.role === 'moderator') : [];
  members.sort((first, second) => Number(second.status === 'pending') - Number(first.status === 'pending'));

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/account">My Account</Link><span aria-hidden="true">›</span><span aria-current="page">My Path Members</span></nav>
      <header className={styles.heading}><h1>My Path Members</h1></header>
      {paths.length > 0 && (
        <nav aria-label="Paths you manage">
          <ul className={styles.pathNav}>{paths.map(item => (
            <li key={item.id}><Link className="button-secondary" href={`/account/path-members?path=${item.id}`} aria-current={item.id === selected?.id ? 'page' : undefined}>{item.title}</Link></li>
          ))}</ul>
        </nav>
      )}
      {!selected && <p>{path === undefined ? 'You don’t manage any Learning Paths yet.' : 'Choose a path you’re authorized to manage.'}</p>}
      {selected && (
        <section aria-labelledby="path-heading">
          <header className={styles.heading}>
            <div>
              <h2 id="path-heading">{selected.title}</h2>
              <p>{members.length} {selected.role === 'moderator'
                ? members.length === 1 ? 'pending request' : 'pending requests'
                : members.length === 1 ? 'membership' : 'memberships'}</p>
            </div>
          </header>
          {members.length === 0 ? <p>{selected.role === 'moderator' ? 'No pending requests.' : 'No memberships yet.'}</p> : (
            <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="Path membership table">
              <table className={`${styles.table} ${styles.memberTable}`}>
                <thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Requested</th><th scope="col" className={styles.actionCell}>Actions</th></tr></thead>
                <tbody>{members.map(member => (
                  <MemberEditor
                    key={member.id}
                    pathId={selected.id}
                    userId={member.user_id}
                    name={member.display_name?.trim() || 'Learner'}
                    role={member.role}
                    status={member.status}
                    requestedAt={member.joined_at}
                    requestedLabel={new Date(member.joined_at).toLocaleDateString()}
                    ownMembership={member.user_id === user.id}
                  />
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
