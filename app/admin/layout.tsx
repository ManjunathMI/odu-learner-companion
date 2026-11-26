import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformOwner } from '@/lib/auth';
import { adminSections } from '@/lib/admin-sections';
import styles from './workspace.module.css';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/admin');
  if (!(await requirePlatformOwner(user))) notFound();

  return (
    <main className={styles.workspace}>
      <nav className={styles.nav} aria-label="Platform administration">
        <Link href="/admin">Platform Admin</Link>
        {Object.entries(adminSections).filter(([slug]) => slug !== 'qa-accounts').map(([slug, label]) => (
          <Link key={slug} href={`/admin/${slug}`}>{label}</Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
