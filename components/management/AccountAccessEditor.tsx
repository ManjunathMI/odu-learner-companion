'use client';

import { useActionState } from 'react';
import { changeAccountAccess, type loadUserDetails } from '@/app/admin/users/actions';
import styles from './management.module.css';

type Audit = Awaited<ReturnType<typeof loadUserDetails>>['audit'];
type AccessState = { message: string; error: boolean; suspended: boolean; audit: NonNullable<Audit> };

export default function AccountAccessEditor({ userId, audit, canManage }: { userId: string; audit: Audit; canManage: boolean }) {
  const [state, action, pending] = useActionState(async (previous: AccessState, form: FormData) => {
    const result = await changeAccountAccess(userId, form);
    return {
      message: result.message,
      error: result.error,
      suspended: result.suspended ?? previous.suspended,
      audit: result.event ? [result.event, ...previous.audit].slice(0, 20) : previous.audit,
    };
  }, { message: '', error: false, suspended: Boolean(audit?.[0]?.suspended), audit: audit ?? [] });

  const status = state.suspended ? 'Suspended' : 'Active';

  return (
    <section aria-label="Account access" className={styles.detailSection}>
      <h2>Account access</h2>
      {audit ? <span className={styles.status} data-status={status.toLowerCase()}>{status}</span> : <p role="alert">Unable to load account access.</p>}
      {canManage && audit && (
        <form action={action} className={styles.editorForm}>
          <label className={styles.field}>
            Access change
            <select name="intent" required defaultValue="">
              <option value="">Choose a change</option>
              {state.suspended ? <option value="restore">Restore access</option> : <option value="suspend">Suspend access</option>}
            </select>
          </label>
          <label className={`${styles.field} ${styles.auditReason}`}>
            Reason for the audit log
            <input type="text" name="reason" maxLength={500} required />
          </label>
          <button type="submit" className="button-primary" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
        </form>
      )}
      {state.message && <p className={`${styles.feedback} ${state.error ? styles.error : ''}`} role={state.error ? 'alert' : 'status'}>{state.message}</p>}
      <details className={styles.accessAudit}>
        <summary>Account access audit trail</summary>
        {audit === null ? <p role="alert">Unable to load audit history.</p> : state.audit.length === 0 ? (
          <p>No account access changes recorded.</p>
        ) : (
          <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="Recent access changes table">
            <table className={`${styles.table} ${styles.compactTable}`}>
              <thead><tr><th scope="col">Change</th><th scope="col">Date</th><th scope="col">Reason</th></tr></thead>
              <tbody>{state.audit.map(event => (
                <tr key={event.id}>
                  <th scope="row">{event.suspended ? 'Suspended' : 'Restored'}</th>
                  <td><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></td>
                  <td>{event.reason}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}
