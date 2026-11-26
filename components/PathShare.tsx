'use client';

import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { pathInvitationMessage } from '@/lib/path-invitation-message';
import { useId, useRef, useState, type FormEvent } from 'react';

interface PathShareProps {
  pathId: string;
  title: string;
  description: string | null;
  membersOnly?: boolean;
}

export default function PathShare({ pathId, title, description, membersOnly = false }: PathShareProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState('');
  const [recipients, setRecipients] = useState('');
  const [status, setStatus] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [sending, setSending] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [results, setResults] = useState<Array<{ recipient: string; status: string }>>([]);
  const { subject, text: invitation } = pathInvitationMessage(title, description, url);

  function openDialog() {
    setUrl(new URL(`/paths/${encodeURIComponent(pathId)}`, window.location.origin).href);
    setRecipients('');
    setStatus('');
    setNeedsSignIn(false);
    setResults([]);
    setCanShare(typeof navigator.share === 'function');
    dialogRef.current?.showModal();
  }

  async function sendInvitations(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setStatus('');
    setResults([]);
    setNeedsSignIn(false);
    try {
      const response = await apiFetch<{ results: Array<{ recipient: string; status: string }> }>(
        `/paths/${pathId}/invitations`, { method: 'POST', body: { recipients } },
      );
      setResults(response.results);
      if (response.results.every(item => item.status === 'sent' || item.status === 'duplicate')) setRecipients('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send invitations.';
      if (message === 'Unauthorized') setNeedsSignIn(true);
      else setStatus(message);
    } finally {
      setSending(false);
    }
  }

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(message);
    } catch {
      setStatus('Copy was unavailable. Select and copy the text from the field.');
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setStatus('Sharing was unavailable. You can copy the link instead.');
      }
    }
  }

  return (
    <>
      <button
        type="button"
        className="button-secondary"
        aria-haspopup="dialog"
        aria-label={membersOnly ? `Copy path link for ${title}` : `Invite & share ${title}`}
        onClick={openDialog}
      >
        {membersOnly ? 'Copy path link' : 'Invite & share'}
      </button>
      <dialog onCancel={event => { if (sending) event.preventDefault(); }} ref={dialogRef} className="path-share-dialog" aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`}>{membersOnly ? 'Members-only path link' : 'Invite & share'}</h2>
        <p>{title}</p>
        {membersOnly ? <p>Only people who already have access can open this path.</p> : (
          <form onSubmit={sendInvitations}>
            <label htmlFor={`${id}-recipients`}>Recipient email addresses</label>
            <input
              id={`${id}-recipients`}
              type="email"
              multiple
              disabled={sending}
              required
              autoFocus
              autoComplete="off"
              aria-describedby={`${id}-help`}
              value={recipients}
              onChange={event => setRecipients(event.target.value)}
            />
            <p id={`${id}-help`}>Separate up to five addresses with commas. Each person gets a separate invitation.</p>
            <p className="subject"><strong>Subject</strong> {subject}</p>
            <label htmlFor={`${id}-message`}>Invitation message</label>
            <textarea id={`${id}-message`} rows={7} readOnly value={invitation} />
            <div className="actions">
              <button type="submit" className="button-primary" disabled={sending}>{sending ? 'Sending…' : 'Send invitations'}</button>
              <button type="button" className="button-secondary" onClick={() => void copy(invitation, 'Invitation copied.')}>Copy invitation</button>
            </div>
            {needsSignIn && <p><Link href={`/auth?next=${encodeURIComponent(`/paths/${pathId}`)}`}>Sign in to send invitations</Link></p>}
            {results.length > 0 && (
              <ul aria-label="Send results" aria-live="polite">{results.map(({ recipient, status }) => (
                <li key={recipient}>{recipient} · {{
                  sent: 'Sent', duplicate: 'Already invited or your own address', failed: 'Send failed',
                  unknown: 'Send unconfirmed', rate_limited: 'Sending limit reached', unavailable: 'Path unavailable',
                }[status] ?? 'Unavailable'}</li>
              ))}</ul>
            )}
          </form>
        )}
        <label htmlFor={`${id}-link`}>Path link</label>
        <input id={`${id}-link`} readOnly value={url} />
        <div className="actions">
          <button type="button" className="button-secondary" onClick={() => void copy(url, 'Link copied.')}>Copy link</button>
          {!membersOnly && canShare && <button type="button" className="button-secondary" onClick={() => void share()}>Share link</button>}
          <button type="button" className="button-secondary" disabled={sending} onClick={() => dialogRef.current?.close()}>Close</button>
        </div>
        <p role="status">{status}</p>
      </dialog>
      <style jsx>{`
        .path-share-dialog {
          position: fixed;
          inset: 0;
          margin: auto;
          box-sizing: border-box;
          width: min(34rem, calc(100% - 2rem));
          max-height: calc(100dvh - 2rem);
          overflow: auto;
          overflow-wrap: anywhere;
          padding: clamp(1rem, 4vw, 1.5rem);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: var(--shadow-lg);
        }
        .path-share-dialog::backdrop { background: rgba(0, 0, 0, .6); }
        h2 { margin: 0 0 .35rem; font-size: 1.35rem; }
        p { margin: .35rem 0; color: var(--text-secondary); font-size: .9rem; }
        label { display: block; margin: .85rem 0 .35rem; font-weight: 700; }
        input, textarea { display: block; width: 100%; box-sizing: border-box; }
        textarea { resize: vertical; }
        .subject { margin-top: .9rem; }
        .actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
        [role="status"]:empty { margin: 0; }
      `}</style>
    </>
  );
}
