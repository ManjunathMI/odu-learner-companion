'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Props {
  onCancel: () => void;
}

export default function CreatePathForm({ onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newPath = await apiFetch<{ id: string; title: string }>('/paths', {
        method: 'POST',
        body: { title: title.trim(), description: description.trim() || undefined, tags },
      });

      router.push(`/paths/${newPath.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-path-form">
      <h2>Create a new learning path</h2>

      <label htmlFor="cp-title">Title <span className="required">*</span></label>
      <input
        id="cp-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. AWS Solutions Architect"
        required
        autoFocus
        maxLength={120}
      />

      <label htmlFor="cp-desc">Description</label>
      <textarea
        id="cp-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What will learners achieve?"
        rows={3}
        maxLength={500}
      />

      <label htmlFor="cp-tags">Tags <span className="hint">(comma-separated)</span></label>
      <input
        id="cp-tags"
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="aws, cloud, certification"
      />

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="button-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create path'}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>

      <style jsx>{`
        .create-path-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
        }
        .create-path-form h2 {
          margin: 0 0 0.25rem;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .create-path-form label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .required { color: var(--accent-danger); }
        .hint { font-weight: 400; font-size: 0.8rem; }
        .form-error {
          color: var(--accent-danger);
          font-size: 0.875rem;
          margin: 0;
        }
        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </form>
  );
}
