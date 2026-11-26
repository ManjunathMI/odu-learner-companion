import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAccountSuspension } from '@/lib/auth';
import { invitationHash } from '@/lib/path-invitations';
import { isInvitationToken, returnDestination } from '@/lib/return-destination';
import { adminClient, createClient } from '@/lib/supabase/server';
import styles from '@/components/management/management.module.css';

export const metadata: Metadata = {
  title: 'Learning Path invitation',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function AcceptInvitation({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { token } = await params;
  if (!isInvitationToken(token)) notFound();
  const destination = returnDestination(`/invitations/accept/${token}`);
  const { result } = await searchParams;

  async function accept() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/auth?next=${encodeURIComponent(destination)}`);
    const suspension = await getAccountSuspension(user.id).catch(() => ({ suspended: true }));
    if (user.email && user.email_confirmed_at && !suspension?.suspended) {
      const { data: pathId, error } = await adminClient.rpc('accept_path_invitation', {
        p_hash: invitationHash(token),
        p_user: user.id,
        p_email: user.email.toLowerCase(),
      });
      if (error) redirect(`${destination}?result=unavailable`);
      if (pathId) redirect(`/paths/${pathId}`);
    }
    redirect(`${destination}?result=invalid`);
  }

  return (
    <main className={styles.page}>
      <h1>Learning Path invitation</h1>
      <p>Accept using the email address that received this invitation. You can then explore the path and request to join.</p>
      {result && <p role="alert">{result === 'unavailable' ? 'Unable to check the invitation right now. Try again later.' : 'This invitation is unavailable or belongs to a different email address.'}</p>}
      <form action={accept}><button className="button-primary" type="submit">Accept invitation</button></form>
      <p><Link href="/explore">Explore Learning Paths</Link></p>
    </main>
  );
}
