import 'server-only';

type Email = { to: string; subject: string; text: string };
type Delivery = { status: 'sent'; providerMessageId: string | null } | { status: 'failed' | 'unknown' };
type EmailSender = {
  provider: 'resend' | 'brevo';
  send: (message: Email, deliveryKey: string) => Promise<Delivery>;
};

async function postEmail(url: string, headers: Record<string, string>, body: object): Promise<Delivery> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return { status: response.status >= 500 || response.status === 408 || response.status === 409 ? 'unknown' : 'failed' };
    }
    const result: { id?: string; messageId?: string } = await response.json().catch(() => ({}));
    return { status: 'sent', providerMessageId: result.id ?? result.messageId ?? null };
  } catch {
    return { status: 'unknown' };
  }
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] ?? character));
}

function emailHtml(text: string) {
  const content = text.split(/(https?:\/\/[^\s<>"']+)/g).map((part, index) => {
    const escaped = escapeHtml(part);
    return index % 2 ? `<a href="${escaped}">${escaped}</a>` : escaped.replace(/\r?\n/g, '<br>');
  }).join('');
  return `<html><body>${content}</body></html>`;
}

// Feature code supplies content and a stable delivery ID. Provider credentials and HTTP stay here.
export function getEmailSender(): EmailSender | null {
  const provider = process.env.NOTIFICATION_EMAIL_PROVIDER?.trim();
  const email = process.env.NOTIFICATION_EMAIL_FROM?.trim();
  const name = process.env.NOTIFICATION_EMAIL_FROM_NAME?.trim() || 'ODU Learner Companion';
  const apiKey = process.env.NOTIFICATION_EMAIL_API_KEY?.trim()
    || (provider === 'resend' ? process.env.RESEND_API_KEY?.trim() : undefined);
  if (!email || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !apiKey || /[\r\n<>]/.test(name)) return null;

  if (provider === 'resend') {
    return {
      provider,
      send: (message, key) => postEmail('https://api.resend.com/emails', {
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': key,
      }, { ...message, from: `${name} <${email}>` }),
    };
  }

  if (provider === 'brevo') {
    return {
      provider,
      send: (message) => postEmail('https://api.brevo.com/v3/smtp/email', { 'api-key': apiKey }, {
        sender: { email, name },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: emailHtml(message.text),
      }),
    };
  }

  return null;
}
