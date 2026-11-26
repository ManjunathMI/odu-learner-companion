'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { apiFetch } from '@/lib/api';
import type { Database } from '@/types/database';
import styles from './management.module.css';

type Membership = Database['public']['Tables']['path_memberships']['Row'];

const roleLabels = { admin: 'Admin', moderator: 'Moderator', learner: 'Learner' };
const statusLabels = { approved: 'Approved', pending: 'Pending', rejected: 'Declined' };

export default function MemberEditor({ pathId, userId, name, role, status, requestedAt, requestedLabel, ownMembership, nameHref, onSaved }: {
  pathId: string;
  userId: string;
  name: string;
  role: Membership['role'];
  status: Membership['status'];
  requestedAt: string;
  requestedLabel: string;
  ownMembership: boolean;
  nameHref?: string;
  onSaved?: (change: Partial<Pick<Membership, 'role' | 'status'>>) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [saving, startSaving] = useTransition();
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  const canEdit = !ownMembership && role !== 'admin';
  const canChangeRole = canEdit && status === 'approved';
  const canReview = canEdit && status === 'pending';
  const currentValue = canReview ? status : role;
  const selection = draft || currentValue;

  function selectValue(value: string) {
    setDraft(value);
    setFeedback(undefined);
  }

  function save() {
    if (saving || selection === currentValue || (!canReview && !canChangeRole)) return;
    setFeedback(undefined);
    startSaving(async () => {
      try {
        const endpoint = canReview ? 'approvals' : 'members';
        const nextRole = selection === 'moderator' ? 'moderator' : 'learner';
        const nextStatus = selection === 'approved' ? 'approved' : 'rejected';
        const body = canReview ? { decision: nextStatus } : { action: nextRole === 'moderator' ? 'promote' : 'demote' };
        await apiFetch(`/paths/${pathId}/${endpoint}/${userId}`, { method: 'POST', body });
        setDraft('');
        setFeedback({ message: 'Changes saved.', error: false });
        if (onSaved) onSaved(canReview ? { status: nextStatus } : { role: nextRole });
        else router.refresh();
      } catch (error) {
        setFeedback({ message: error instanceof Error ? error.message : 'Unable to save changes.', error: true });
      }
    });
  }

  return (
    <tr>
      <th scope="row">{nameHref ? <Link href={nameHref}>{name}</Link> : name}</th>
      <td>
        {canChangeRole ? (
          <span className={styles.selectWrap}>
            <select className={styles.rowSelect} aria-label={`Role for ${name}`} value={selection} disabled={saving}
              onChange={event => selectValue(event.target.value)}>
              <option value="learner">Learner</option>
              <option value="moderator">Moderator</option>
            </select>
          </span>
        ) : roleLabels[role]}
      </td>
      <td>
        {canReview ? (
          <span className={styles.selectWrap}>
            <select className={styles.rowSelect} aria-label={`Status for ${name}`} value={selection} disabled={saving}
              onChange={event => selectValue(event.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Declined</option>
            </select>
          </span>
        ) : <span data-status={status} className={styles.status}>{statusLabels[status]}</span>}
      </td>
      <td><time dateTime={requestedAt}>{requestedLabel}</time></td>
      <td className={styles.actionCell}>
        {(canChangeRole || canReview) && (
          <button type="button" className={`button-primary ${styles.rowSave}`} aria-label={`Save changes for ${name}`}
            disabled={saving || selection === currentValue} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        <div className={`${styles.rowFeedback} ${feedback?.error ? styles.error : ''}`} role={feedback?.error ? 'alert' : 'status'}>
          {feedback?.message}
        </div>
      </td>
    </tr>
  );
}
