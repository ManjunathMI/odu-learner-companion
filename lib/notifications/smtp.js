import 'server-only';
import nodemailer from 'nodemailer';

/** @param {{ host: string, port: number, user: string, password: string, email: string, name: string }} settings */
export function createSmtpSender({ host, port, user, password, email, name }) {
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass: password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  /** @param {{ to: string, subject: string, text: string }} message */
  return async ({ to, subject, text }) => {
    try {
      const result = await transport.sendMail({
        from: { name, address: email },
        to: { address: to },
        envelope: { from: email, to: [to] },
        subject,
        text,
      });
      if (result.accepted.length !== 1) return { status: /** @type {const} */ ('failed') };
      return { status: /** @type {const} */ ('sent'), providerMessageId: result.messageId ?? null };
    } catch (error) {
      // A disconnect or timeout may follow server acceptance. Leave that outcome unconfirmed.
      const code = error?.responseCode;
      const rejected = Number.isInteger(code) && code >= 400 && code < 600;
      return { status: rejected ? /** @type {const} */ ('failed') : /** @type {const} */ ('unknown') };
    }
  };
}
