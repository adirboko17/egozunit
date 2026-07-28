const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const CONTACT_TO_EMAIL = 'bokobzadir@gmail.com';
const CONTACT_SUBJECT = 'יצירת קשר - אתר אגוז';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clean(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function normalizePayload(body) {
  return {
    firstName: clean(body.firstName, 80),
    lastName: clean(body.lastName, 80),
    email: clean(body.email, 254).toLowerCase(),
    phone: clean(body.phone, 40),
    subject: clean(body.subject, 160),
    message: clean(body.message, 5000),
    website: clean(body.website, 200),
  };
}

function validate(data) {
  if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message) {
    return 'missing_fields';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'invalid_email';
  }
  return '';
}

function senderAddress() {
  const configured = process.env.RESEND_FROM_EMAIL || 'office@egoz.org.il';
  return configured.includes('<') ? configured : `עמותת אגוז <${configured}>`;
}

function emailHtml(data) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const receivedAt = new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem',
  }).format(new Date());

  const detailRow = (label, value, link) => {
    const content = link
      ? `<a href="${escapeHtml(link)}" style="color:#2459a9;text-decoration:none;font-weight:600">${escapeHtml(value)}</a>`
      : escapeHtml(value);
    return `
      <tr>
        <td dir="rtl" align="right" style="direction:rtl;text-align:right;padding:11px 0;color:#687386;font-size:14px;width:105px;vertical-align:top">${label}</td>
        <td dir="rtl" align="right" style="direction:rtl;text-align:right;padding:11px 0;color:#13223d;font-size:15px;font-weight:600;vertical-align:top">${content}</td>
      </tr>`;
  };

  return `<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"></head>
<body dir="rtl" style="margin:0;background:#f3f5f8;font-family:Arial,'Helvetica Neue',sans-serif;color:#13223d;direction:rtl;text-align:right">
  <div style="display:none;max-height:0;overflow:hidden">פנייה חדשה מאת ${escapeHtml(fullName)}</div>
  <table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="direction:rtl;background:#f3f5f8;padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="direction:rtl;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(16,37,72,.10)">
          <tr>
            <td dir="rtl" align="right" style="direction:rtl;text-align:right;padding:30px 34px;background:linear-gradient(135deg,#0b1f46,#2459a9);color:#ffffff">
              <div style="font-size:13px;color:#c9d8f4;margin-bottom:8px">עמותת אגוז · הסיירת הצפונית</div>
              <h1 style="margin:0;font-size:26px;line-height:1.3">פנייה חדשה מהאתר</h1>
            </td>
          </tr>
          <tr>
            <td dir="rtl" align="right" style="direction:rtl;text-align:right;padding:28px 34px">
              <p style="margin:0 0 20px;color:#4c5b70;font-size:15px;line-height:1.7">
                התקבלה פנייה חדשה דרך טופס יצירת הקשר באתר.
              </p>
              <table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="direction:rtl;text-align:right;border-collapse:collapse;border-top:1px solid #e7ebf0;border-bottom:1px solid #e7ebf0">
                ${detailRow('שם מלא', fullName)}
                ${detailRow('אימייל', data.email, `mailto:${data.email}`)}
                ${detailRow('טלפון', data.phone || 'לא צוין', data.phone ? `tel:${data.phone.replace(/[^\d+]/g, '')}` : '')}
                ${detailRow('נושא', data.subject)}
                ${detailRow('התקבל בתאריך', receivedAt)}
              </table>
              <div dir="rtl" style="direction:rtl;text-align:right;margin-top:24px">
                <div style="margin-bottom:9px;color:#687386;font-size:14px">תוכן ההודעה</div>
                <div dir="rtl" style="direction:rtl;text-align:right;padding:18px 20px;background:#f7f8fa;border-right:4px solid #c4a86c;border-radius:10px;color:#1b2b46;font-size:15px;line-height:1.8;white-space:pre-wrap">${escapeHtml(data.message)}</div>
              </div>
              <div dir="rtl" style="direction:rtl;text-align:right;margin-top:26px">
                <a href="mailto:${escapeHtml(data.email)}?subject=${encodeURIComponent(`תגובה לפנייתך בנושא: ${data.subject}`)}" style="display:inline-block;padding:12px 22px;background:#2459a9;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700">השבה לפונה</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 34px;background:#f7f8fa;color:#7a8596;font-size:12px;text-align:center">
              הודעה זו נשלחה אוטומטית מטופס יצירת הקשר באתר אגוז.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailText(data) {
  return [
    CONTACT_SUBJECT,
    '',
    `שם: ${data.firstName} ${data.lastName}`,
    `אימייל: ${data.email}`,
    `טלפון: ${data.phone || 'לא צוין'}`,
    `נושא: ${data.subject}`,
    '',
    'תוכן ההודעה:',
    data.message,
  ].join('\n');
}

async function sendContactEmail(body) {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error('RESEND_API_KEY is not configured');
    error.code = 'missing_api_key';
    throw error;
  }

  const data = normalizePayload(body || {});
  if (data.website) return { skipped: true };

  const validationError = validate(data);
  if (validationError) {
    const error = new Error(validationError);
    error.code = validationError;
    throw error;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderAddress(),
      to: [CONTACT_TO_EMAIL],
      subject: CONTACT_SUBJECT,
      html: emailHtml(data),
      text: emailText(data),
      reply_to: data.email,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || 'Resend request failed');
    error.code = 'resend_failed';
    error.status = response.status;
    throw error;
  }

  return result;
}

module.exports = {
  sendContactEmail,
};
