import nodemailer from 'nodemailer';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

export async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const from = `"Joanluna Viajes" <${process.env.MAIL_USER}>`;

  try {
    await transporter.sendMail({ from, to, subject, html, text });
  } catch (err) {
    console.error('[mailer] Error al enviar email:', err.message);
  }
}

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
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#ff7e2d;letter-spacing:-0.5px;">
                Joanluna Viajes
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              ${body}
            </td>
          </tr>
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

export function sendInquiryToAgency(inquiry) {
  const { name, phone, email, passengers, message, offerTitle } = inquiry;

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeOfferTitle = escapeHtml(offerTitle);
  const safeMessage = escapeHtml(message);
  const safePassengers = escapeHtml(passengers);

  const offerLine = offerTitle
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Oferta</td><td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${safeOfferTitle}</td></tr>`
    : '';

  const messageLine = message
    ? `<div style="margin-top:20px;padding:16px;background:#fafaf9;border-radius:10px;border-left:3px solid #ff7e2d;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#a8a29e;">Mensaje del cliente</p>
        <p style="margin:0;font-size:14px;color:#44403c;line-height:1.6;">${safeMessage}</p>
       </div>`
    : '';

  const html = baseTemplate({
    title: 'Nueva solicitud de cotización',
    preheader: `${safeName} solicitó información${offerTitle ? ` sobre "${safeOfferTitle}"` : ''}.`,
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">Nueva solicitud</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#78716c;">Un cliente completó el formulario de cotización.</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Nombre</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Teléfono</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">
            <a href="https://wa.me/${phone.replace(/\D/g, '')}" style="color:#ff7e2d;text-decoration:none;">${safePhone}</a>
          </td>
        </tr>
        ${email ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Email</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">
            <a href="mailto:${safeEmail}" style="color:#ff7e2d;text-decoration:none;">${safeEmail}</a>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;color:#78716c;font-size:14px;">Pasajeros</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;font-weight:600;text-align:right;">${safePassengers}</td>
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

export function sendConfirmationToClient(inquiry) {
  const { name, email, offerTitle } = inquiry;
  if (!email) return Promise.resolve();

  const safeName = escapeHtml(name);
  const safeOfferTitle = escapeHtml(offerTitle);

  const offerMention = offerTitle
    ? `<p style="margin:0 0 20px;font-size:15px;color:#57534e;">Recibimos tu consulta sobre <strong style="color:#1c1917;">${safeOfferTitle}</strong>.</p>`
    : `<p style="margin:0 0 20px;font-size:15px;color:#57534e;">Recibimos tu consulta.</p>`;

  const html = baseTemplate({
    title: '¡Recibimos tu consulta!',
    preheader: 'Te contactaremos a la brevedad para coordinar tu viaje.',
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">¡Hola, ${safeName}!</h1>
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

export function sendWelcomeWithPassword({ email, name, password, loginUrl }) {
  const safeName     = escapeHtml(name);
  const safePassword = escapeHtml(password);
  const safeUrl      = escapeHtml(loginUrl);

  const html = baseTemplate({
    title: 'Tu acceso a Joanluna Viajes',
    preheader: `Bienvenido/a ${safeName}. Tu contraseña temporal es: ${safePassword}`,
    body: `
      <h1 style="margin:0 0 6px;font-size:22px;color:#1c1917;font-weight:700;">¡Bienvenido/a, ${safeName}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#78716c;">
        Tu cuenta en <strong style="color:#1c1917;">Joanluna Viajes</strong> fue creada.
        A continuación encontrás tus credenciales de acceso:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding:12px 16px;background:#f5f5f4;border-radius:10px 10px 0 0;border-bottom:1px solid #e7e5e4;">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a8a29e;">Email</p>
            <p style="margin:0;font-size:14px;color:#1c1917;font-weight:600;">${escapeHtml(email)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;background:#fff7ed;border-radius:0 0 10px 10px;border:1px solid #fed7aa;border-top:none;">
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#a8a29e;">Contraseña temporal</p>
            <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:0.15em;color:#ff7e2d;font-family:monospace;">${safePassword}</p>
          </td>
        </tr>
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="${safeUrl}"
          style="display:inline-block;background:#ff7e2d;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
          Iniciar sesión
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#a8a29e;text-align:center;">
        Al ingresar se te pedirá que elijas una contraseña nueva.<br/>
        Si no esperabas este mensaje, ignoralo.
      </p>
    `,
  });

  return sendMail({
    to: email,
    subject: 'Tu acceso a Joanluna Viajes',
    html,
    text: `Hola ${name}, tu cuenta fue creada en Joanluna Viajes.\nEmail: ${email}\nContraseña temporal: ${password}\nIngresá en: ${loginUrl}\nSe te pedirá cambiar la contraseña al iniciar sesión.`,
  });
}
