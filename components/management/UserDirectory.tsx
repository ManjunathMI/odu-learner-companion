'use client';

import Link from 'next/link';
import { Fragment, useActionState, useId, useRef, useState } from 'react';
import { changePathLimit, loadUserDetails } from '@/app/admin/users/actions';
import { MAX_PATH_LIMIT } from '@/lib/creator-limits';
import AccountAccessEditor from './AccountAccessEditor';
import MemberEditor from './MemberEditor';
import styles from './management.module.css';

type Account = {
  id: string;
  name: string;
  type: 'Platform owner' | 'QA account' | 'User';
  lastSignIn: string | null;
  lastSignInLabel: string;
  created: string;
  createdLabel: string;
  quota: { usage: number; limit: number } | null;
};

type Details = Awaited<ReturnType<typeof loadUserDetails>>;
type Expanded = { id: string; details?: Details; error?: boolean };

export default function UserDirectory({ accounts }: { accounts: Account[] }) {
  const [expanded, setExpanded] = useState<Expanded>();
  const [savedLimits, setSavedLimits] = useState<Record<string, number>>({});
  const request = useRef(0);
  const prefix = useId();

  async function open(id: string) {
    const revision = ++request.current;
    setExpanded({ id });
    try {
      const details = await loadUserDetails(id);
      if (request.current === revision) setExpanded({ id, details });
    } catch {
      if (request.current === revision) setExpanded({ id, error: true });
    }
  }

  function close() {
    request.current++;
    setExpanded(undefined);
  }

  return (
    <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="User accounts table">
      <table className={styles.table}>
        <thead><tr><th scope="col">Account</th><th scope="col">Account type</th><th scope="col">Last sign-in</th><th scope="col">Created</th><th scope="col">Path Limit</th><th scope="col" className={styles.actionCell}>Actions</th></tr></thead>
        <tbody>{accounts.map(account => {
          const isOpen = expanded?.id === account.id;
          const limit = savedLimits[account.id] ?? account.quota?.limit;
          const panelId = `${prefix}-${account.id}`;
          return (
            <Fragment key={account.id}>
              <tr>
                <th scope="row">{account.name}</th>
                <td>{account.type}</td>
                <td>{account.lastSignIn ? <time dateTime={account.lastSignIn}>{account.lastSignInLabel}</time> : 'Never'}</td>
                <td><time dateTime={account.created}>{account.createdLabel}</time></td>
                <td>{account.quota && limit !== undefined ? `${account.quota.usage} / ${limit}` : 'Unavailable'}</td>
                <td className={styles.actionCell}>
                  <div className={styles.actions}>
                    <button type="button" className="button-secondary" aria-label={`${isOpen ? 'Close' : 'Manage'} ${account.name}`}
                      aria-expanded={isOpen} aria-controls={panelId} onClick={() => isOpen ? close() : void open(account.id)}>
                      {isOpen ? 'Close' : 'Manage'}
                    </button>
                  </div>
                </td>
              </tr>
              <tr hidden={!isOpen} className={styles.editorRow}>
                <td colSpan={6}>
                  <div id={panelId} className={styles.editorPanel}>
                    {isOpen && (expanded.details ? <UserDetails account={account} details={expanded.details} limit={limit}
                      onLimitSaved={value => setSavedLimits(current => ({ ...current, [account.id]: value }))} /> : expanded.error ? (
                      <div role="alert">
                        <p>Unable to load account details.</p>
                        <button className="button-secondary" type="button" onClick={() => void open(account.id)}>Try again</button>
                      </div>
                    ) : <p role="status">Loading account details…</p>)}
                  </div>
                </td>
              </tr>
            </Fragment>
          );
        })}</tbody>
      </table>
    </div>
  );
}

function UserDetails({ account, details, limit, onLimitSaved }: {
  account: Account; details: Details; limit?: number; onLimitSaved: (value: number) => void;
}) {
  const [memberships, setMemberships] = useState(details.memberships);

  return (
    <div className={styles.userDetails}>
      <AccountAccessEditor userId={account.id} audit={details.audit} canManage={account.type === 'User'} />
      <section className={styles.detailSection} aria-label="Referrals">
        <h2>Referrals</h2>
        {details.invitations && <p>{details.invitations.sent} sent · {details.invitations.accepted} accepted · {details.invitations.joined} joined after acceptance</p>}
        <Link href={`/admin/invitations?sender=${account.id}`}>View invitations</Link>
      </section>
      <PathLimitEditor userId={account.id} limit={limit} onSaved={onLimitSaved} />
      <section aria-label="Path memberships" className={styles.detailSection}>
        <h2>Path memberships</h2>
        {memberships === null ? <p role="alert">Unable to load memberships.</p> : memberships.length === 0 ? <p>No path memberships.</p> : (
          <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="Path memberships table">
            <table className={`${styles.table} ${styles.memberTable}`}>
              <thead><tr><th scope="col">Learning Path</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Requested</th><th scope="col" className={styles.actionCell}>Actions</th></tr></thead>
              <tbody>{memberships.map(membership => (
                <MemberEditor key={membership.id} pathId={membership.path_id} userId={account.id}
                  name={membership.learning_paths.title} nameHref={`/paths/${membership.path_id}`}
                  role={membership.role} status={membership.status} ownMembership={account.type === 'Platform owner'}
                  requestedAt={membership.joined_at} requestedLabel={new Date(membership.joined_at).toLocaleDateString()}
                  onSaved={change => setMemberships(current => current?.map(item => item.id === membership.id ? { ...item, ...change } : item) ?? null)}
                />
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      <section aria-label="Paths created" className={styles.detailSection}>
        <h2>Paths created</h2>
        {details.paths === null ? <p role="alert">Unable to load paths.</p> : details.paths.length === 0 ? <p>No paths created.</p> : (
          <ul className={styles.createdPaths}>
            {details.paths.map(path => <li key={path.id}><Link href={`/paths/${path.id}`}>{path.title}</Link></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

function PathLimitEditor({ userId, limit, onSaved }: { userId: string; limit?: number; onSaved: (value: number) => void }) {
  const fieldId = useId();
  const [feedback, action, pending] = useActionState(async (_previous: { message: string; error: boolean }, form: FormData) => {
    const result = await changePathLimit(userId, form);
    if (result.limit === undefined) return { message: result.error, error: true };
    onSaved(result.limit);
    return { message: 'Path limit saved.', error: false };
  }, { message: '', error: false });

  return (
    <section className={styles.detailSection} aria-label="Path creation limit">
      <form action={action} className={styles.pathLimitForm}>
        <label htmlFor={fieldId}>Path Limit</label>
        <input id={fieldId} key={limit} type="number" name="pathLimit" min={0} max={MAX_PATH_LIMIT} step={1} defaultValue={limit} required />
        <button type="submit" className="button-primary" disabled={pending}>{pending ? 'Saving…' : 'Save limit'}</button>
      </form>
      {feedback.message && <p className={`${styles.feedback} ${feedback.error ? styles.error : ''}`} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    </section>
  );
}
