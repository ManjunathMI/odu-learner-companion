'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { apiFetch } from '@/lib/api';

export default function ReminderButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [working, start] = useTransition();
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <>
      <button className="button-secondary" type="button" disabled={working || attempted} onClick={() => start(async () => {
        setMessage('');
        try {
          const { status } = await apiFetch<{ status: string }>(`/invitations/${invitationId}/reminder`, { method: 'POST' });
          setAttempted(true);
          setMessage(status === 'sent' ? 'Reminder sent.' : status === 'unknown' ? 'Reminder send unconfirmed.' : 'Reminder failed.');
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Unable to send reminder.');
        }
      })}>{working ? 'Sending…' : 'Send reminder'}</button>
      {message && <p role="status">{message}</p>}
    </>
  );
}
