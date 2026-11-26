'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { MAX_PATH_LIMIT } from '@/lib/creator-limits';
import styles from './creator-quota.module.css';

export type CreatorQuotaData = { usage: number; limit: number; pendingLimit: number | null };

export default function CreatorQuota({ quota }: { quota: CreatorQuotaData | null }) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [submittedLimit, setSubmittedLimit] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const limit = Number(fields.get('limit'));
    setPending(true);
    setError('');
    try {
      await apiFetch('/quota-requests', {
        method: 'POST',
        body: { requested_limit: limit, reason: fields.get('reason') },
      });
      setSubmittedLimit(limit);
      setOpen(false);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to submit quota request.');
    } finally {
      setPending(false);
    }
  }

  const pendingLimit = quota?.pendingLimit ?? submittedLimit;

  return (
    <section id="creator-quota" className={styles.card} aria-labelledby={id}>
      <div className={styles.summary}>
        <div>
          <h2 id={id}>Learning Path quota</h2>
          {quota ? <p><strong>{quota.usage} / {quota.limit}</strong> paths created{quota.usage >= quota.limit && ' · Limit reached'}</p> : <p role="status">Quota is temporarily unavailable.</p>}
        </div>
        {quota && pendingLimit === null && quota.limit < MAX_PATH_LIMIT && (
          <button type="button" className="button-secondary" aria-expanded={open} aria-controls={`${id}-request`}
            onClick={() => { setOpen(!open); setError(''); }}>
            {open ? 'Close request form' : 'Request more quota'}
          </button>
        )}
      </div>
      {pendingLimit !== null && <p className={styles.notice} role="status">Request for {pendingLimit} paths awaiting review.</p>}
      <div id={`${id}-request`}>
        {quota && pendingLimit === null && open && (
          <form className={styles.form} onSubmit={submit}>
            <label>Requested limit
              <input type="number" name="limit" min={quota.limit + 1} max={MAX_PATH_LIMIT} defaultValue={quota.limit + 1} required />
            </label>
            <label>Reason (optional)
              <input type="text" name="reason" />
            </label>
            <button type="submit" className="button-primary" disabled={pending}>{pending ? 'Submitting…' : 'Submit request'}</button>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
