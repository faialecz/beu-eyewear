import 'server-only';

interface Email {
  to: string;
  subject: string;
  html: string;
  // Printed instead of sent when no API key is configured (local dev).
  devLink?: string;
}

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

// Brevo's free tier (300 emails/day) over its REST API. EMAIL_FROM must be a
// sender you've verified in Brevo.
export async function sendEmail({ to, subject, html, devLink }: Email) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BREVO_API_KEY is not set');
    }
    console.log(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] Link: ${devLink ?? '(none)'}\n`);
    return;
  }

  const senderEmail = process.env.EMAIL_FROM;
  if (!senderEmail) throw new Error('EMAIL_FROM is not set');

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME ?? 'BeU Eyewear', email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo responded ${response.status}: ${await response.text().catch(() => '')}`);
  }
}

// Absolute base URL for links in emails.
export function appUrl() {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
