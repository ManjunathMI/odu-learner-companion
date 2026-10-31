'use client';

import { useEffect, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { apiFetch } from '@/lib/api';
import { feedbackRequestTypes, validateFeedbackSubmission } from '@/lib/feedback-validation';

const typeLabels = {
  query: 'Query',
  feedback: 'Feedback',
  bug: 'Bug',
  business_enquiry: 'Business enquiry',
} as const;

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestType, setRequestType] = useState<(typeof feedbackRequestTypes)[number]>('query');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const openDialog = (opener: HTMLElement) => {
    openerRef.current = opener;
    setError('');
    setSubmitted(false);
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      nameRef.current?.focus();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const handleFeedbackLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href="#feedback"]');
      if (!link) return;
      event.preventDefault();
      openDialog(link);
    };
    document.addEventListener('click', handleFeedbackLink, true);
    return () => document.removeEventListener('click', handleFeedbackLink, true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const validation = validateFeedbackSubmission({ name, email, phone, requestType, message });
    if (!validation.value) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/feedback', { method: 'POST', body: validation.value });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setRequestType('query');
      setMessage('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="feedback-launcher"
        aria-haspopup="dialog"
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => openDialog(event.currentTarget)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v7.5A2.75 2.75 0 0 1 17.25 16H11l-5.5 4v-4.18A2.75 2.75 0 0 1 4 13.25z" />
          <path d="M8 8h8M8 11.5h5" />
        </svg>
        <span>Feedback &amp; help</span>
      </button>

      <dialog
        ref={dialogRef}
        className="feedback-dialog"
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-intro"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={handleClose}
      >
        <header className="feedback-dialog-header">
          <div>
            <p className="feedback-kicker">ODU Learner Companion</p>
            <h2 id="feedback-dialog-title">Feedback &amp; help</h2>
            <p id="feedback-dialog-intro">Tell us what you need. A member of our team will review it and, if a reply is needed, contact you by email.</p>
          </div>
          <button type="button" className="button-secondary feedback-close" onClick={closeDialog}>Close</button>
        </header>

        <div className="feedback-dialog-content">
          {submitted ? (
            <div className="feedback-success" role="status">
              <h3>Thanks for getting in touch.</h3>
              <p>Your message has been received. Our team handles replies manually, so please keep an eye on the email address you provided.</p>
              <button type="button" className="button-primary" onClick={handleClose}>Done</button>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="feedback-name">Name <span aria-hidden="true">*</span></label>
              <input ref={nameRef} id="feedback-name" name="name" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required />

              <label htmlFor="feedback-email">Email address <span aria-hidden="true">*</span></label>
              <input id="feedback-email" name="email" type="email" autoComplete="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} required />

              <label htmlFor="feedback-phone">Phone number <span className="optional">Optional</span></label>
              <input id="feedback-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />

              <label htmlFor="feedback-type">What is this about? <span aria-hidden="true">*</span></label>
              <select id="feedback-type" name="requestType" value={requestType} onChange={(event) => setRequestType(event.target.value as typeof requestType)} required>
                {feedbackRequestTypes.map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}
              </select>

              <label htmlFor="feedback-message">Your message <span aria-hidden="true">*</span></label>
              <textarea id="feedback-message" name="message" rows={5} minLength={10} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="Tell us what happened or how we can help." />
              <p className="feedback-privacy">Please use plain text and avoid sharing passwords or other sensitive information.</p>

              {error && <p className="feedback-error" role="alert">{error}</p>}
              <div className="feedback-actions">
                <button type="submit" className="button-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</button>
              </div>
            </form>
          )}
        </div>
      </dialog>

      <style jsx>{`
        .feedback-launcher { position:fixed;right:1.25rem;bottom:1.25rem;z-index:var(--z-fixed);display:inline-flex;align-items:center;gap:.55rem;min-height:3rem;padding:.7rem 1rem;border:1px solid var(--border-color);border-radius:var(--radius-full);background:var(--button-gradient);color:#fff;box-shadow:var(--shadow-lg);font-weight:700; }
        .feedback-launcher:hover:not(:disabled) { color:#fff;filter:brightness(1.05);box-shadow:var(--shadow-xl); }
        .feedback-launcher svg { width:1.2rem;height:1.2rem;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
        .feedback-dialog { position:fixed;inset:0;width:min(34rem,calc(100vw - 2rem));max-width:calc(100vw - 2rem);max-height:calc(100dvh - 2rem);margin:auto;padding:0;overflow:hidden;border:1px solid var(--border-color);border-radius:var(--radius-lg);background:var(--bg-primary);color:var(--text-primary);box-shadow:var(--shadow-xl); }
        .feedback-dialog[open] { display:grid;grid-template-rows:auto minmax(0,1fr); }
        .feedback-dialog::backdrop { background:rgba(8,8,15,.62);backdrop-filter:blur(3px); }
        .feedback-dialog-header { display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:1.25rem 1.4rem;border-bottom:1px solid var(--border-color);background:var(--surface-card); }
        .feedback-dialog-header h2 { margin:0;font-size:1.45rem;line-height:1.2; }
        .feedback-dialog-header p:not(.feedback-kicker) { max-width:27rem;margin:.5rem 0 0;color:var(--text-secondary);font-size:.92rem;line-height:1.5; }
        .feedback-kicker { margin:0 0 .4rem;color:var(--accent-primary);font-size:.7rem;font-weight:800;text-transform:uppercase; }
        .feedback-close { flex:0 0 auto; }
        .feedback-dialog-content { overflow-y:auto;overscroll-behavior:contain;padding:1.25rem 1.4rem; }
        .feedback-form { display:grid;grid-template-columns:1fr;gap:.55rem; }
        .feedback-form label { margin-top:.4rem;font-size:.88rem;font-weight:700; }
        .feedback-form label span:not(.optional) { color:var(--accent-danger); }
        .optional { margin-left:.35rem;color:var(--text-secondary);font-size:.78rem;font-weight:400; }
        .feedback-form input,.feedback-form select,.feedback-form textarea { width:100%;min-width:0;max-width:100%; }
        .feedback-form textarea { resize:vertical;min-height:7rem; }
        .feedback-privacy { margin:.1rem 0 .3rem;color:var(--text-secondary);font-size:.78rem;line-height:1.45; }
        .feedback-error { margin:.25rem 0;color:var(--accent-danger);font-size:.88rem; }
        .feedback-actions { display:flex;justify-content:flex-end;margin-top:.25rem; }
        .feedback-success h3 { margin:0 0 .5rem;font-size:1.2rem; }
        .feedback-success p { color:var(--text-secondary);line-height:1.55; }
        @media(max-width:600px) { .feedback-launcher { right:.75rem;bottom:.75rem; }.feedback-dialog { width:calc(100vw - 1rem);max-width:calc(100vw - 1rem);max-height:calc(100dvh - 1rem);border-radius:var(--radius-md); }.feedback-dialog-header,.feedback-dialog-content { padding:1rem; }.feedback-dialog-header { gap:.6rem; }.feedback-dialog-header h2 { font-size:1.25rem; }.feedback-close { padding:.55rem .7rem; } }
      `}</style>
    </>
  );
}