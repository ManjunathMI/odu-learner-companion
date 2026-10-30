'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// One themed confirmation card; native dialog supplies modal focus and Escape handling.
export function ConfirmationDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="confirmation-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`} onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id={`${id}-title`}>{title}</h2>
    <p id={`${id}-message`}>{message}</p>
    <div className="dialog-actions">
      <button type="button" className="button-secondary" autoFocus onClick={onCancel}>Cancel</button>
      <button type="button" className="button-secondary confirm-danger" onClick={onConfirm}>{confirmLabel}</button>
    </div>
    <style jsx>{`
      .confirmation-dialog { box-sizing:border-box;width:calc(100% - 2rem);max-width:32rem;max-height:calc(100dvh - 2rem);overflow:auto;padding:1.5rem;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);box-shadow:var(--shadow-md); }
      .confirmation-dialog::backdrop { background:rgba(0,0,0,.6); }
      .confirmation-dialog h2 { margin:0 0 1rem;font-size:1.35rem; }
      .confirmation-dialog p { margin:0;color:var(--text-secondary);line-height:1.65;white-space:pre-line;overflow-wrap:anywhere; }
      .dialog-actions { display:flex;justify-content:flex-end;flex-wrap:wrap;gap:.75rem;margin-top:1.5rem; }
      .confirm-danger { color:var(--accent-danger);border-color:var(--accent-danger); }
    `}</style>
  </dialog>;
}

export function useDeletePathConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(() => () => { pending.current?.(false); pending.current = null; }, []);
  const confirm = useCallback((text: string) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>(resolve => { pending.current = resolve; setMessage(text); });
  }, []);
  const finish = (choice: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setMessage(null);
    resolve?.(choice);
  };
  return {
    confirm,
    confirmation: <ConfirmationDialog open={message !== null} title="Delete learning path" message={message ?? ''} confirmLabel="Delete path" onConfirm={() => finish(true)} onCancel={() => finish(false)} />,
  };
}
