import Link from 'next/link';
import { invitationStatuses, loadInvitationPage, loadInvitationTotals, type InvitationRow } from '@/lib/invitation-directory';
import { configuredInvitations } from '@/lib/path-invitations';
import ReminderButton from './ReminderButton';
import styles from '@/components/management/management.module.css';

export type InvitationFilters = { page?: string; status?: string; recipient?: string; sender?: string };

export default async function InvitationDirectory({ senderId, ownerView, filters }: {
  senderId: string | null;
  ownerView: boolean;
  filters: InvitationFilters;
}) {
  const base = ownerView ? '/admin/invitations' : '/journey/invitations';
  const page = Math.min(10000, Math.max(1, Number.isInteger(Number(filters.page)) ? Number(filters.page) : 1));
  const status = filters.status && Object.hasOwn(invitationStatuses, filters.status) ? filters.status as InvitationRow['status'] : undefined;
  const recipient = typeof filters.recipient === 'string' ? filters.recipient.trim().slice(0, 254) : undefined;
  const [records, totals] = await Promise.all([loadInvitationPage(senderId, page, status, recipient), loadInvitationTotals(senderId)]);
  const canSend = !ownerView && Boolean(configuredInvitations());

  function pageLink(nextPage: number) {
    const query = new URLSearchParams({ page: String(nextPage) });
    if (status) query.set('status', status);
    if (recipient) query.set('recipient', recipient);
    if (ownerView && senderId) query.set('sender', senderId);
    return `${base}?${query}`;
  }

  return (
    <>
      {totals && <p>{totals.sent} sent · {totals.reminders} reminder attempts · {totals.accepted} accepted · {totals.joined} joined after acceptance</p>}
      <form action={base} className={styles.editorForm}>
        {ownerView && senderId && <input type="hidden" name="sender" value={senderId} />}
        <label className={styles.field}>Recipient email<input defaultValue={recipient} name="recipient" type="search" /></label>
        <label className={styles.field}>Status
          <select name="status" defaultValue={status ?? ''}>
            <option value="">All statuses</option>
            {Object.entries(invitationStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="button-secondary">Apply filters</button>
        {ownerView && senderId && <Link href={base}>Clear sender filter</Link>}
      </form>
      {!records ? <p role="alert">Unable to load invitations.</p> : records.rows.length === 0 ? <p>No invitations match this view.</p> : (
        <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="Invitations table">
          <table className={styles.table}>
            <thead><tr>{ownerView && <th scope="col">Sender</th>}<th scope="col">Recipient</th><th scope="col">Learning Path</th>
              <th scope="col">Status</th><th scope="col">Email history</th>{canSend && <th scope="col">Actions</th>}</tr></thead>
            <tbody>{records.rows.map(row => {
              const events = records.history?.filter(event => event.invitation_id === row.id);
              return (
                <tr key={row.id}>
                  {ownerView && <td><Link href={`${base}?sender=${row.sender_id}`}>{row.sender_email}</Link></td>}
                  <th scope="row">{row.recipient_email}</th>
                  <td><Link href={`/paths/${row.path_id}`}>{row.path_title}</Link></td>
                  <td><span className={styles.status} data-status={row.status === 'joined' ? 'approved' : undefined}>{invitationStatuses[row.status]}</span></td>
                  <td>{events?.length ? (
                    <details>
                      <summary>{row.last_attempt_at ? new Date(row.last_attempt_at).toLocaleDateString() : 'Attempts'}</summary>
                      <ul>{events.map(event => (
                        <li key={event.id}>{event.kind === 'initial' ? 'Invitation' : 'Reminder'} · {event.status === 'reserved' || event.status === 'unknown' ? 'Unconfirmed' : event.status} · <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></li>
                      ))}</ul>
                    </details>
                  ) : 'Unavailable'}</td>
                  {canSend && <td>{row.can_remind && <ReminderButton invitationId={row.id} />}</td>}
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      {(page > 1 || records?.hasNext) && <nav className={styles.pager} aria-label="Invitation pages">
        {page > 1 && <Link href={pageLink(page - 1)}>Previous</Link>}
        <span>Page {page}</span>
        {records?.hasNext && page < 10000 && <Link href={pageLink(page + 1)}>Next</Link>}
      </nav>}
    </>
  );
}
