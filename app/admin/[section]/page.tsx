import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminSections } from '@/lib/admin-sections';
import Documents from '@/components/admin/Documents';
import FeedbackInbox from '@/components/admin/FeedbackInbox';
import PlatformWorkspace from '@/components/admin/PlatformWorkspace';
import QaAccounts from '@/components/admin/QaAccounts';

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!Object.hasOwn(adminSections, section)) notFound();
  const title = adminSections[section as keyof typeof adminSections];

  return (
    <>
      <nav aria-label="Breadcrumb">
        <Link href="/admin">Platform Admin</Link>
        {section === 'qa-accounts' && <> › <Link href="/admin/users">User Management</Link></>}
        {' › '}<span aria-current="page">{title}</span>
      </nav>
      <h1>{title}</h1>
      {section === 'feedback' && <FeedbackInbox />}
      {section === 'documents' && <Documents />}
      {section === 'qa-accounts' && <QaAccounts />}
      {(section === 'publication' || section === 'paths' || section === 'quotas') && <PlatformWorkspace key={section} section={section} />}
    </>
  );
}
