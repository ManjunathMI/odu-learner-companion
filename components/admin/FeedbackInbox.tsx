'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { feedbackRequestTypes, type FeedbackRequestType } from '@/lib/feedback-validation';

type FeedbackStatus = 'open' | 'in_progress' | 'answered' | 'closed';

interface FeedbackRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  request_type: FeedbackRequestType;
  message: string;
  status: FeedbackStatus;
  response_text: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

const typeLabels: Record<FeedbackRequestType, string> = {
  query: 'Queries',
  feedback: 'Feedback',
  bug: 'Bug reports',
  business_enquiry: 'Business enquiries',
};

const typeSubjectLabels: Record<FeedbackRequestType, string> = {
  query: 'Query',
  feedback: 'Feedback',
  bug: 'Bug report',
  business_enquiry: 'Business enquiry',
};

const statusLabels: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  answered: 'Answered',
  closed: 'Closed',
};

function emailDraftUrl(request: FeedbackRequest, response: string) {
  const parameters = new URLSearchParams({
    subject: `ODU ${typeSubjectLabels[request.request_type]}`,
    body: response,
  });
  return `mailto:${request.email}?${parameters.toString()}`;
}

export default function FeedbackInbox() {
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, FeedbackStatus>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FeedbackRequest[]>('/admin/feedback-requests');
      setRequests(data);
      setResponses((current) => ({
        ...Object.fromEntries(data.map((request) => [request.id, request.response_text ?? ''])),
        ...current,
      }));
      setStatuses((current) => ({
        ...Object.fromEntries(data.map((request) => [request.id, request.status])),
        ...current,
      }));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load feedback requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void apiFetch<FeedbackRequest[]>('/admin/feedback-requests').then((data) => {
      if (!active) return;
      setRequests(data);
      setResponses(Object.fromEntries(data.map((request) => [request.id, request.response_text ?? ''])));
      setStatuses(Object.fromEntries(data.map((request) => [request.id, request.status])));
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load feedback requests');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const save = async (request: FeedbackRequest) => {
    const status = statuses[request.id] ?? request.status;
    const responseText = responses[request.id]?.trim();
    if (status === 'answered' && !responseText && !request.response_text) {
      setError('Write and send a reply before marking this request answered.');
      return;
    }

    setBusy(request.id);
    setError('');
    try {
      const updated = await apiFetch<Pick<FeedbackRequest, 'id' | 'status' | 'response_text' | 'responded_by' | 'responded_at' | 'updated_at'>>(
        `/admin/feedback-requests/${request.id}`,
        { method: 'PATCH', body: { status, ...(responseText ? { responseText } : {}) } },
      );
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, ...updated } : item));
      setResponses((current) => ({ ...current, [request.id]: updated.response_text ?? '' }));
      setStatuses((current) => ({ ...current, [request.id]: updated.status }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the response');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="feedback-inbox" aria-labelledby="feedback-inbox-heading">
      <div className="feedback-inbox-heading">
        <div>
          <p className="section-kicker">Support</p>
          <h2 id="feedback-inbox-heading">Feedback &amp; help requests</h2>
        </div>
        <button type="button" className="button-secondary" onClick={() => void load()} disabled={loading || Boolean(busy)}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <p className="feedback-inbox-intro">Requests are grouped by type. Replies are sent manually from your email; use the email draft, send it, then record the response here.</p>
      {error && <p className="feedback-inbox-error" role="alert">{error}</p>}
      {loading ? <p className="feedback-inbox-muted">Loading requests…</p> : !requests.length ? <p className="feedback-inbox-muted">No feedback requests yet.</p> : (
        <div className="feedback-type-groups">
          {feedbackRequestTypes.map((type) => {
            const group = requests.filter((request) => request.request_type === type);
            if (!group.length) return null;
            return (
              <section className="feedback-type-group" key={type} aria-labelledby={`feedback-group-${type}`}>
                <div className="feedback-type-heading">
                  <h3 id={`feedback-group-${type}`}>{typeLabels[type]}</h3>
                  <span>{group.length}</span>
                </div>
                <div className="feedback-request-list">
                  {group.map((request) => {
                    const response = responses[request.id] ?? request.response_text ?? '';
                    const status = statuses[request.id] ?? request.status;
                    return (
                      <article className="feedback-request" key={request.id}>
                        <div className="feedback-request-heading">
                          <div>
                            <h4>{request.name}</h4>
                            <a href={`mailto:${request.email}`}>{request.email}</a>
                            {request.phone && <span className="feedback-phone">{request.phone}</span>}
                          </div>
                          <span className={`feedback-status ${status}`}>{statusLabels[status]}</span>
                        </div>
                        <p className="feedback-message">{request.message}</p>
                        <p className="feedback-dates">
                          Received <time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time>
                          {request.responded_at && <> · Response recorded <time dateTime={request.responded_at}>{new Date(request.responded_at).toLocaleString()}</time></>}
                        </p>
                        {request.response_text && <p className="saved-response"><strong>Recorded response</strong><br />{request.response_text}</p>}
                        <label className="feedback-response-label" htmlFor={`feedback-response-${request.id}`}>Response to send or update</label>
                        <textarea
                          id={`feedback-response-${request.id}`}
                          rows={3}
                          maxLength={5000}
                          value={response}
                          onChange={(event) => setResponses((current) => ({ ...current, [request.id]: event.target.value }))}
                          placeholder="Write your reply in plain text."
                        />
                        <div className="feedback-request-actions">
                          <label className="status-select-label" htmlFor={`feedback-status-${request.id}`}>
                            Status
                            <select id={`feedback-status-${request.id}`} value={status} onChange={(event) => setStatuses((current) => ({ ...current, [request.id]: event.target.value as FeedbackStatus }))}>
                              {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </label>
                          <div className="feedback-response-actions">
                            <a className={`button-secondary email-draft ${response.trim() ? '' : 'disabled'}`} href={response.trim() ? emailDraftUrl(request, response.trim()) : undefined} aria-disabled={!response.trim()} onClick={(event) => { if (!response.trim()) event.preventDefault(); }}>
                              Open email draft
                            </a>
                            <button type="button" className="button-primary" disabled={busy === request.id || Boolean(busy)} onClick={() => void save(request)}>
                              {busy === request.id ? 'Saving…' : 'Save status / response'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .feedback-inbox { margin-top:3rem;padding-top:2rem;border-top:1px solid var(--border-color); }
        .feedback-inbox-heading,.feedback-type-heading,.feedback-request-heading,.feedback-request-actions,.feedback-response-actions { display:flex;align-items:center;justify-content:space-between;gap:1rem; }
        .feedback-inbox-heading h2 { margin:0;font-size:1.45rem; }
        .section-kicker { margin:0 0 .35rem;color:var(--accent-primary);font-size:.72rem;font-weight:800;text-transform:uppercase; }
        .feedback-inbox-intro,.feedback-inbox-muted,.feedback-dates,.feedback-phone { color:var(--text-secondary);font-size:.88rem;line-height:1.5; }
        .feedback-type-group { margin-top:2rem; }
        .feedback-type-heading { margin-bottom:.75rem;padding:.7rem 0;border-bottom:1px solid var(--border-color); }
        .feedback-type-heading h3 { margin:0;font-size:1.1rem; }
        .feedback-type-heading span { color:var(--text-secondary);font-size:.85rem; }
        .feedback-request-list { display:grid;gap:1rem; }
        .feedback-request { min-width:0;padding:1.1rem;background:var(--surface-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm); }
        .feedback-request-heading h4 { margin:0 0 .25rem;font-size:1rem; }
        .feedback-request-heading a { overflow-wrap:anywhere;font-size:.88rem; }
        .feedback-phone { display:block;margin-top:.2rem; }
        .feedback-status { flex:0 0 auto;padding:.25rem .55rem;border-radius:var(--radius-full);background:var(--bg-tertiary);font-size:.74rem;font-weight:700; }
        .feedback-status.open,.feedback-status.in_progress { color:var(--accent-warning); }
        .feedback-status.answered { color:var(--accent-secondary); }
        .feedback-status.closed { color:var(--text-secondary); }
        .feedback-message { margin:.85rem 0;white-space:pre-wrap;overflow-wrap:anywhere; }
        .feedback-dates { margin:.5rem 0; }
        .saved-response { margin:.75rem 0;padding:.75rem;background:var(--bg-tertiary);border-radius:var(--radius-md);white-space:pre-wrap;overflow-wrap:anywhere; }
        .feedback-response-label,.status-select-label { display:grid;gap:.4rem;font-size:.85rem;font-weight:700; }
        .feedback-request textarea { width:100%;min-width:0;max-width:100%;box-sizing:border-box;resize:vertical; }
        .feedback-request-actions { align-items:flex-end;margin-top:.75rem;flex-wrap:wrap; }
        .status-select-label { width:min(11rem,100%); }
        .feedback-response-actions { justify-content:flex-end;flex-wrap:wrap; }
        .email-draft.disabled { opacity:.5;cursor:not-allowed; }
        .feedback-inbox-error { color:var(--accent-danger); }
        @media(max-width:640px) { .feedback-request-heading { align-items:flex-start; }.feedback-request-actions { align-items:stretch;flex-direction:column; }.status-select-label { width:100%; }.feedback-response-actions { width:100%; }.feedback-response-actions > * { flex:1; }.feedback-response-actions a { white-space:normal;text-align:center; } }
      `}</style>
    </section>
  );
}