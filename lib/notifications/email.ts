import 'server-only';

import { createSmtpSender } from './smtp.js';

type Email = { to: string; subject: string; text: string };
type Delivery = { status: 'sent'; providerMessageId: string | null } | { status: 'failed' | 'unknown' };
type EmailSender = {
  provider: 'resend' | 'brevo' | 'smtp';
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
const purposeSettings = {
  invitations: 'INVITATIONS',
  feedback: 'FEEDBACK',
  campaign: 'CAMPAIGN',
} as const;

export const isNotificationEmailAddress = (email: string) =>
  email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email);

export function getEmailSender(purpose: keyof typeof purposeSettings): EmailSender | null {
  const prefix = `NOTIFICATION_${purposeSettings[purpose]}_`;
  const setting = (key: string) => process.env[`${prefix}${key}`]?.trim() || process.env[`NOTIFICATION_${key}`]?.trim();
  const provider = process.env[`${prefix}EMAIL_PROVIDER`]?.trim()
    || (purpose === 'invitations' ? process.env.NOTIFICATION_EMAIL_PROVIDER?.trim() : undefined);
  const email = setting('EMAIL_FROM');
  const name = setting('EMAIL_FROM_NAME') || 'ODU Learner Companion';
  if (!email || !isNotificationEmailAddress(email) || /[\r\n<>]/.test(name)) return null;

  if (provider === 'smtp') {
    const host = setting('SMTP_HOST');
    const port = Number(setting('SMTP_PORT') || '465');
    const user = setting('SMTP_USER');
    const password = process.env[`${prefix}SMTP_PASSWORD`] || process.env.NOTIFICATION_SMTP_PASSWORD;
    if (!host || !user || !password || (port !== 465 && port !== 587)) return null;
    const send = createSmtpSender({ host, port, user, password, email, name });
    return { provider, send };
  }

  const apiKey = process.env[`${prefix}EMAIL_API_KEY`]?.trim()
    || process.env.NOTIFICATION_EMAIL_API_KEY?.trim()
    || (provider === 'resend' ? process.env.RESEND_API_KEY?.trim() : undefined);
  if (!apiKey) return null;

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
