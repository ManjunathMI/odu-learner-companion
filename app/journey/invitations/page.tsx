import Link from 'next/link';
import { redirect } from 'next/navigation';
import InvitationDirectory, { type InvitationFilters } from '@/components/invitations/InvitationDirectory';
import styles from '@/components/management/management.module.css';
import { createClient } from '@/lib/supabase/server';

export default async function MyInvitations({ searchParams }: { searchParams: Promise<InvitationFilters> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/journey/invitations');

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/journey">My Journey</Link><span aria-hidden="true">›</span><span aria-current="page">My Invitations</span></nav>
      <header className={styles.heading}><h1>My Invitations</h1></header>
      <InvitationDirectory senderId={user.id} ownerView={false} filters={await searchParams} />
    </main>
  );
}
