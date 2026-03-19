import nodemailer from 'nodemailer';

/* ─── Transporter ──────────────────────────────────────────── */

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[mailer] MAIL_USER o MAIL_APP_PASSWORD no configurados. Los emails no se enviarán.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: user.trim(), pass: pass.trim() },
  });

  return _transporter;
}

/* ─── Helper base ──────────────────────────────────────────── */

export async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) return; // silently skip if not configured

  const from = `"Joanluna Viajes" <${process.env.MAIL_USER}>`;

  try {
    await transporter.sendMail({ from, to, subject, html, text });
  } catch (err) {
    // Never let email failure break the request flow
    console.error('[mailer] Error al enviar email:', err.message);
  }
}

/* ─── Template helpers ─────────────────────────────────────── */

function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:#f5f5f4;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#ff7e2d;letter-spacing:-0.5px;">
                Joanluna Viajes
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;color:#a8a29e;">
              Joanluna Viajes · Este es un mensaje automático, no respondas este email.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Email: nueva cotización → agencia ────────────────────── */

export function sendInquiryToAgency(inquiry) {
  const {
    name, phone, email, passengers,
    message, offerTitle, offerSlug,
  } = inquiry;

  const offerLine = offerTitle
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Oferta</td><td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${offerTitle}</td></tr>`
    : '';

  const messageLine = message
    ? `<div style="margin-top:20px;padding:16px;background:#fafaf9;border-radius:10px;border-left:3px solid #ff7e2d;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a8a29e;">Mensaje del cliente</p>
        <p style="margin:0;font-size:14px;color:#44403c;line-height:1.6;">${message}</p>
       </div>`
    : '';

  const html = baseTemplate({
    title: 'Nueva solicitud de cotización',
    preheader: `${name} solicitó información${offerTitle ? ` sobre "${offerTitle}"` : ''}.`,
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">Nueva solicitud</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#78716c;">Un cliente completó el formulario de cotización.</p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Nombre</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Teléfono</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">
            <a href="https://wa.me/${phone.replace(/\D/g, '')}" style="color:#ff7e2d;text-decoration:none;">${phone}</a>
          </td>
        </tr>
        ${email ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Email</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">
            <a href="mailto:${email}" style="color:#ff7e2d;text-decoration:none;">${email}</a>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Pasajeros</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${passengers}</td>
        </tr>
        ${offerLine}
      </table>

      ${messageLine}

      <div style="margin-top:28px;text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/cotizaciones"
           style="display:inline-block;background:#ff7e2d;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
          Ver en el panel
        </a>
      </div>
    `,
  });

  const to = (process.env.MAIL_TO || '').trim() || process.env.MAIL_USER;
  return sendMail({
    to,
    subject: `Nueva consulta de ${name}${offerTitle ? ` — ${offerTitle}` : ''}`,
    html,
    text: `Nueva cotización de ${name} | Tel: ${phone}${email ? ` | Email: ${email}` : ''} | Pasajeros: ${passengers}${offerTitle ? ` | Oferta: ${offerTitle}` : ''}${message ? `\n\n${message}` : ''}`,
  });
}

/* ─── Email: confirmación → cliente ────────────────────────── */

export function sendConfirmationToClient(inquiry) {
  const { name, email, offerTitle } = inquiry;
  if (!email) return Promise.resolve(); // no email, skip

  const offerMention = offerTitle
    ? `<p style="margin:0 0 20px;font-size:15px;color:#57534e;">Recibimos tu consulta sobre <strong style="color:#1c1917;">${offerTitle}</strong>.</p>`
    : `<p style="margin:0 0 20px;font-size:15px;color:#57534e;">Recibimos tu consulta.</p>`;

  const html = baseTemplate({
    title: '¡Recibimos tu consulta!',
    preheader: 'Te contactaremos a la brevedad para coordinar tu viaje.',
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">¡Hola, ${name}!</h1>
      ${offerMention}

      <div style="background:#fff7ed;border-radius:12px;border:1px solid #fed7aa;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;color:#9a3412;line-height:1.6;">
          Un asesor te va a contactar a la brevedad por <strong>WhatsApp o email</strong> para coordinar todos los detalles de tu viaje. 🌍
        </p>
      </div>

      <p style="margin:0 0 4px;font-size:13px;color:#a8a29e;">¿Tenés alguna pregunta urgente? Escribinos directamente:</p>
      <a href="https://wa.me/${(process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '')}"
         style="display:inline-block;margin-top:8px;background:#25d366;color:#ffffff;font-size:14px;font-weight:700;padding:10px 24px;border-radius:10px;text-decoration:none;">
        Contactar por WhatsApp
      </a>
    `,
  });

  return sendMail({
    to: email,
    subject: '¡Recibimos tu consulta! — Joanluna Viajes',
    html,
    text: `Hola ${name}, recibimos tu consulta${offerTitle ? ` sobre "${offerTitle}"` : ''}. Te contactaremos a la brevedad. ¡Gracias!`,
  });
}

/* ─── Newsletter: envío masivo ─────────────────────────────── */

export async function sendNewsletterCampaign({ subject, html, emails }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[mailer] Newsletter no enviado: transporter no configurado.');
    return { sent: 0, failed: 0 };
  }

  const from = `"Joanluna Viajes" <${process.env.MAIL_USER}>`;
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await transporter.sendMail({ from, to: email, subject, html });
      sent++;
    } catch (err) {
      console.error(`[mailer] Error enviando newsletter a ${email}:`, err.message);
      failed++;
    }
  }

  return { sent, failed };
}
