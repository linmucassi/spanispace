// Transactional email for Spanispace. Server-only, never import from a client
// component, the API key must not reach the browser.
//
// Resend over plain fetch rather than the SDK, because this is one endpoint and
// the repo has no email dependency to keep in step otherwise. Two env vars,
// RESEND_API_KEY and EMAIL_FROM, both set in the Netlify dashboard. When either
// is missing every send returns { sent: false } instead of throwing, so a
// feature that depends on email degrades to silence rather than to an error.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  sent: boolean;
  reason?: 'not_configured' | 'invalid_recipient' | 'send_failed';
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'not_configured' };
  }
  if (!to || !to.includes('@')) {
    return { sent: false, reason: 'invalid_recipient' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html,
        text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[email] Resend rejected the send:', response.status, detail);
      return { sent: false, reason: 'send_failed' };
    }

    return { sent: true };
  } catch (error) {
    console.error('[email] Resend request failed:', error);
    return { sent: false, reason: 'send_failed' };
  }
}

// Escapes user-supplied values before they go into the HTML body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ApplicationEmailInput = {
  fullName: string;
  jobTitle: string;
  company: string;
};

export function applicationReceivedEmail({
  fullName,
  jobTitle,
  company,
}: ApplicationEmailInput): { subject: string; html: string; text: string } {
  // The greeting is the only part of this email that carries a value the
  // applicant typed, so it is capped hard. Everything else comes from the
  // database. A 200 character "first name" is someone trying to write their
  // own message in a mail signed by spanispace.com.
  const firstName = (fullName.trim().split(/\s+/)[0] || 'there').slice(0, 40);
  const subject = `We received your application for ${jobTitle}`;

  const text = [
    `Hi ${firstName},`,
    '',
    `Your application for ${jobTitle} at ${company} is in. It is saved on your Spanispace account and it has been passed to the employer.`,
    '',
    'What happens next. The employer reviews applications in their Spanispace portal and contacts you directly if they want to take things further. That can take a couple of weeks, so keep applying in the meantime.',
    '',
    'You can see every job you have applied for, and the status of each one, at https://spanispace.com/candidate/applications',
    '',
    'Good luck,',
    'The Spanispace team',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      <p style="margin:0 0 16px;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(company)}</strong> is in.
        It is saved on your Spanispace account and it has been passed to the employer.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
        <strong>What happens next.</strong> The employer reviews applications in their Spanispace portal and contacts
        you directly if they want to take things further. That can take a couple of weeks, so keep applying in the meantime.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
        You can see every job you have applied for, and the status of each one, on your dashboard.
      </p>
      <a href="https://spanispace.com/candidate/applications"
         style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:bold;">
        View my applications
      </a>
      <p style="margin:32px 0 0;font-size:14px;color:#64748b;">Good luck,<br />The Spanispace team</p>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}
