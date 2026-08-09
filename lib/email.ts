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

// Shared shell so every notification email below looks like it came from the
// same product, not six different one-off templates.
function wrapEmail(bodyHtml: string, ctaHref?: string, ctaLabel?: string): string {
  const cta = ctaHref && ctaLabel
    ? `<a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:bold;margin-top:8px;">${escapeHtml(ctaLabel)}</a>`
    : '';
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      ${bodyHtml}
      ${cta}
      <p style="margin:32px 0 0;font-size:14px;color:#64748b;">The Spanispace team</p>
    </div>
  </body>
</html>`;
}

type ApplicationStatusEmailInput = {
  jobTitle: string;
  company: string;
  status: 'reviewed' | 'shortlisted' | 'rejected' | 'hired' | string;
};

const APPLICATION_STATUS_COPY: Record<string, string> = {
  reviewed: 'has been reviewed by the employer',
  shortlisted: 'moved to the shortlist',
  rejected: 'was not taken further this time',
  hired: 'resulted in an offer — congratulations',
};

export function applicationStatusEmail({
  jobTitle,
  company,
  status,
}: ApplicationStatusEmailInput): { subject: string; html: string; text: string } {
  const statusLine = APPLICATION_STATUS_COPY[status] ?? `changed to "${status}"`;
  const subject = `Update on your application for ${jobTitle}`;
  const text = [
    `Your application for ${jobTitle} at ${company} ${statusLine}.`,
    '',
    'See the full status at https://spanispace.com/candidate/applications',
  ].join('\n');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
      Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(company)}</strong> ${escapeHtml(statusLine)}.
    </p>`,
    'https://spanispace.com/candidate/applications',
    'View my applications'
  );
  return { subject, html, text };
}

type NewMessageEmailInput = { senderName: string; preview: string };

export function newMessageEmail({
  senderName,
  preview,
}: NewMessageEmailInput): { subject: string; html: string; text: string } {
  const subject = `New message from ${senderName}`;
  const text = [`${senderName} sent you a message on Spanispace:`, '', `"${preview}"`, '', 'Reply at https://spanispace.com/candidate/messages'].join('\n');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;"><strong>${escapeHtml(senderName)}</strong> sent you a message on Spanispace:</p>
     <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;border-left:3px solid #e2e8f0;padding-left:12px;">${escapeHtml(preview)}</p>`,
    'https://spanispace.com/candidate/messages',
    'Reply'
  );
  return { subject, html, text };
}

type EventRegistrationEmailInput = { eventTitle: string; eventDate: string };

export function eventRegistrationEmail({
  eventTitle,
  eventDate,
}: EventRegistrationEmailInput): { subject: string; html: string; text: string } {
  const subject = `You're registered: ${eventTitle}`;
  const text = [`You're confirmed for ${eventTitle} on ${eventDate}.`, '', 'See it at https://spanispace.com/events'].join('\n');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">You're confirmed for <strong>${escapeHtml(eventTitle)}</strong> on <strong>${escapeHtml(eventDate)}</strong>.</p>`,
    'https://spanispace.com/events',
    'View event'
  );
  return { subject, html, text };
}

type ExpiryAlertEmailInput = { listingTitle: string; expiryDate: string; daysLeft: 7 | 1 };

export function expiryAlertEmail({
  listingTitle,
  expiryDate,
  daysLeft,
}: ExpiryAlertEmailInput): { subject: string; html: string; text: string } {
  const subject = daysLeft === 1
    ? `"${listingTitle}" expires tomorrow`
    : `"${listingTitle}" expires in 7 days`;
  const text = [
    `Your listing "${listingTitle}" expires on ${expiryDate}.`,
    'Extend it from your company dashboard if you want it to stay visible.',
    '',
    'https://spanispace.com/company/jobs',
  ].join('\n');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your listing <strong>${escapeHtml(listingTitle)}</strong> expires on <strong>${escapeHtml(expiryDate)}</strong>. Extend it if you want it to stay visible.</p>`,
    'https://spanispace.com/company/jobs',
    'Manage my listings'
  );
  return { subject, html, text };
}

type WeeklyDigestEmailInput = { matches: { title: string; company: string; location: string }[] };

export function weeklyDigestEmail({
  matches,
}: WeeklyDigestEmailInput): { subject: string; html: string; text: string } {
  const subject = `${matches.length} new job${matches.length === 1 ? '' : 's'} matching your skills`;
  const text = [
    'New this week, matching skills on your profile:',
    '',
    ...matches.map((m) => `- ${m.title} at ${m.company} (${m.location})`),
    '',
    'https://spanispace.com/jobs',
  ].join('\n');
  const rows = matches
    .map(
      (m) =>
        `<li style="margin-bottom:10px;"><strong>${escapeHtml(m.title)}</strong><br /><span style="color:#64748b;font-size:14px;">${escapeHtml(m.company)} · ${escapeHtml(m.location)}</span></li>`
    )
    .join('');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;">New this week, matching skills on your profile:</p>
     <ul style="margin:0 0 16px;padding-left:20px;">${rows}</ul>`,
    'https://spanispace.com/jobs',
    'See all jobs'
  );
  return { subject, html, text };
}

type ProfileNudgeEmailInput = { missingFields: string[] };

export function profileNudgeEmail({
  missingFields,
}: ProfileNudgeEmailInput): { subject: string; html: string; text: string } {
  const subject = 'Finish your Spanispace profile to get noticed';
  const list = missingFields.join(', ');
  const text = [
    `Your profile is missing: ${list}.`,
    'Companies search on complete profiles first — it takes a couple of minutes to finish.',
    '',
    'https://spanispace.com/candidate/profile',
  ].join('\n');
  const html = wrapEmail(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your profile is still missing: <strong>${escapeHtml(list)}</strong>.</p>
     <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Companies search on complete profiles first — it takes a couple of minutes to finish.</p>`,
    'https://spanispace.com/candidate/profile',
    'Finish my profile'
  );
  return { subject, html, text };
}
