'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import ManagementRow from '@/components/management/ManagementRow';
import styles from '@/components/management/management.module.css';

type Account = { user_id: string; email: string; delivery_email: string; enabled: boolean };

function QaAccountEditor({ account, onSave }: { account: Account; onSave: (account: Account) => Promise<void> }) {
  const [deliveryEmail, setDeliveryEmail] = useState(account.delivery_email);
  const [enabled, setEnabled] = useState(account.enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const changed = deliveryEmail !== account.delivery_email || enabled !== account.enabled;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!changed || saving) return;
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await onSave({ ...account, delivery_email: deliveryEmail, enabled });
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save QA account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className={styles.editorForm} onSubmit={save}>
        <label className={`${styles.field} ${styles.reason}`}>
          Delivery email
          <input type="email" required value={deliveryEmail} onChange={event => setDeliveryEmail(event.target.value)} />
        </label>
        <label className={styles.field}>
          Access
          <select value={enabled ? 'enabled' : 'disabled'} onChange={event => setEnabled(event.target.value === 'enabled')}>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <button className="button-primary" disabled={!changed || saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
      {error && <p className={`${styles.feedback} ${styles.error}`} role="alert">{error}</p>}
      {saved && !changed && <p className={styles.feedback} role="status">Changes saved.</p>}
    </>
  );
}

export default function QaAccounts() {
  const [rows, setRows] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [recipient, setRecipient] = useState('immanjunath@outlook.com');

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError('');
    try {
      const accounts = await apiFetch<Account[]>('/admin/qa-accounts', { signal });
      if (!signal?.aborted) setRows(accounts);
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load QA accounts.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void apiFetch<Account[]>('/admin/qa-accounts', { signal: controller.signal })
      .then(accounts => { if (!controller.signal.aborted) setRows(accounts); })
      .catch(failure => {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to load QA accounts.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function update(account: Account) {
    await apiFetch('/admin/qa-accounts', { method: 'PATCH', body: account });
    setRows(current => current.map(row => row.user_id === account.user_id ? account : row));
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiFetch('/admin/qa-accounts', { method: 'POST', body: { email, delivery_email: recipient } });
      setEmail('');
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to create QA account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="QA and developer accounts">
      <p>Delivery email settings take effect when QA forwarding is connected. Disabling an account blocks new sign-ins.</p>
      {error && <p role="alert" className={styles.error}>{error} <button className="button-secondary" type="button" onClick={() => void load()}>Retry</button></p>}
      <details className={styles.audit}>
        <summary>Add QA account</summary>
        <form className={styles.editorForm} onSubmit={add}>
          <label className={styles.field}>
            QA email
            <input type="email" required value={email} placeholder="learner.test@odu.local" onChange={event => setEmail(event.target.value)} />
          </label>
          <label className={styles.field}>
            Delivery email
            <input type="email" required value={recipient} onChange={event => setRecipient(event.target.value)} />
          </label>
          <button type="submit" className="button-primary" disabled={busy}>{busy ? 'Adding…' : 'Add account'}</button>
        </form>
      </details>
      {loading ? <p role="status">Loading QA accounts…</p> : rows.length > 0 ? (
        <div className={styles.tableFrame} tabIndex={0} role="region" aria-label="QA accounts table">
          <table className={styles.table}>
            <thead><tr><th scope="col">QA account</th><th scope="col">Delivery email</th><th scope="col">Access</th><th scope="col" className={styles.actionCell}>Actions</th></tr></thead>
            <tbody>{rows.map(account => (
              <ManagementRow key={account.user_id} name={account.email} cells={[
                account.delivery_email,
                <span key="status" className={styles.status} data-status={account.enabled ? 'active' : 'suspended'}>{account.enabled ? 'Enabled' : 'Disabled'}</span>,
              ]} editor={<QaAccountEditor account={account} onSave={update} />} />
            ))}</tbody>
          </table>
        </div>
      ) : !error && <p>No QA accounts registered.</p>}
    </section>
  );
}
