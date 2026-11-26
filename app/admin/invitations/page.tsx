import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePlatformOwner } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/return-destination';
import InvitationDirectory, { type InvitationFilters } from '@/components/invitations/InvitationDirectory';
import styles from '@/components/management/management.module.css';

export default async function AdminInvitations({ searchParams }: { searchParams: Promise<InvitationFilters> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await requirePlatformOwner(user))) notFound();
  const filters = await searchParams;
  if (filters.sender !== undefined && (typeof filters.sender !== 'string' || !isUuid(filters.sender))) notFound();

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/admin">Platform Admin</Link><span aria-hidden="true">›</span><span aria-current="page">Invitations &amp; Referrals</span></nav>
      <header className={styles.heading}><h1>Invitations &amp; Referrals</h1></header>
      <InvitationDirectory senderId={filters.sender ?? null} ownerView filters={filters} />
    </>
  );
}
