import 'server-only';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function layout(heading: string, intro: string, buttonLabel: string, url: string, outro: string) {
  const href = escapeHtml(url);
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">${heading}</h1>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6">${intro}</p>
    <p style="margin:0 0 24px"><a href="${href}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:bold">${buttonLabel}</a></p>
    <p style="margin:0 0 8px;font-size:12px;color:#666;line-height:1.6">${outro}</p>
    <p style="margin:0;font-size:12px;color:#666;word-break:break-all">Or paste this link into your browser: ${href}</p>
  </div>
</body></html>`;
}

export function verifyEmailTemplate(name: string, url: string) {
  return {
    subject: 'Confirm your email for BeU Eyewear',
    html: layout(
      `Hi ${escapeHtml(name)}, confirm your email`,
      'Tap the button below to confirm this email address for your BeU Eyewear account.',
      'Confirm email',
      url,
      'This link expires in 24 hours. If you didn’t request it, you can ignore this email.',
    ),
  };
}

export function resetPasswordTemplate(name: string, url: string) {
  return {
    subject: 'Reset your BeU Eyewear password',
    html: layout(
      `Hi ${escapeHtml(name)}, reset your password`,
      'We received a request to reset your password. Tap the button below to choose a new one.',
      'Reset password',
      url,
      'This link expires in 1 hour and works once. If you didn’t ask for this, you can ignore this email — your password won’t change.',
    ),
  };
}
