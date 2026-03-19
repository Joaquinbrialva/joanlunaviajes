/* ─── Newsletter HTML generator ────────────────────────────────
   Converts a blocks array into a full HTML email string.
   Used by the frontend composer (live preview) and sent to the
   backend which stores it and delivers it to subscribers.
─────────────────────────────────────────────────────────────── */

const ACCENT   = '#ff7e2d';
const BG_OUTER = '#f5f5f4';
const BG_CARD  = '#ffffff';
const TEXT_1   = '#1c1917';
const TEXT_2   = '#78716c';

/* ─── Individual block renderers ──────────────────────────── */

function renderHeader({ imageUrl, eyebrow, headline, subtext }) {
  const img = imageUrl
    ? `<img src="${imageUrl}" alt="${headline || ''}" width="560" style="display:block;width:100%;max-width:560px;height:240px;object-fit:cover;border-radius:12px 12px 0 0;" />`
    : '';
  return `
  <tr>
    <td style="padding-bottom:0;">
      ${img}
      <div style="padding:28px 32px 20px;background:${BG_CARD};border-radius:${imageUrl ? '0' : '12px 12px'} 12px 12px;">
        ${eyebrow ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${ACCENT};">${eyebrow}</p>` : ''}
        ${headline ? `<h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:${TEXT_1};line-height:1.2;">${headline}</h1>` : ''}
        ${subtext ? `<p style="margin:0;font-size:15px;color:${TEXT_2};line-height:1.6;">${subtext}</p>` : ''}
      </div>
    </td>
  </tr>`;
}

function renderText({ content }) {
  if (!content) return '';
  const html = content
    .split('\n\n')
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;color:${TEXT_2};line-height:1.7;">${p.replace(/\n/g, '<br />')}</p>`)
    .join('');
  return `
  <tr>
    <td style="padding:0 32px 20px;">
      ${html}
    </td>
  </tr>`;
}

function renderOfferCard({ offerData }) {
  if (!offerData) return '';
  const { title, subtitle, pricing, images } = offerData;
  const imageUrl  = images?.cover || images?.gallery?.[0] || '';
  const price     = pricing?.basePrice;
  const currency  = pricing?.currency || 'ARS';
  return `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
        ${imageUrl ? `<tr><td><img src="${imageUrl}" alt="${title}" width="100%" style="display:block;height:160px;object-fit:cover;" /></td></tr>` : ''}
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${ACCENT};">Oferta destacada</p>
            <p style="margin:0 0 4px;font-size:17px;font-weight:800;color:${TEXT_1};">${title}</p>
            ${subtitle ? `<p style="margin:0 0 12px;font-size:13px;color:${TEXT_2};">${subtitle}</p>` : ''}
            ${price ? `<p style="margin:0;font-size:20px;font-weight:800;color:${ACCENT};">desde ${currency} ${Number(price).toLocaleString('es-AR')}</p>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderDestinationCard({ destinationData }) {
  if (!destinationData) return '';
  const { name, country, shortDescription, featuredImage } = destinationData;
  return `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
        ${featuredImage ? `<tr><td><img src="${featuredImage}" alt="${name}" width="100%" style="display:block;height:140px;object-fit:cover;" /></td></tr>` : ''}
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0 0 3px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${ACCENT};">Destino</p>
            <p style="margin:0 0 4px;font-size:17px;font-weight:800;color:${TEXT_1};">${name}</p>
            <p style="margin:0;font-size:13px;color:${TEXT_2};">${country}${shortDescription ? ` — ${shortDescription}` : ''}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderCta({ label, url, style }) {
  const bg = style === 'secondary' ? '#1c1917' : ACCENT;
  return `
  <tr>
    <td style="padding:4px 32px 24px;text-align:center;">
      <a href="${url || '#'}" style="display:inline-block;background:${bg};color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:10px;text-decoration:none;">
        ${label || 'Ver más'}
      </a>
    </td>
  </tr>`;
}

function renderDivider() {
  return `
  <tr>
    <td style="padding:4px 32px 20px;">
      <div style="height:1px;background:#e7e5e4;"></div>
    </td>
  </tr>`;
}

function renderBlock(block) {
  switch (block.type) {
    case 'header':      return renderHeader(block.data || {});
    case 'text':        return renderText(block.data || {});
    case 'offer':       return renderOfferCard(block.data || {});
    case 'destination': return renderDestinationCard(block.data || {});
    case 'cta':         return renderCta(block.data || {});
    case 'divider':     return renderDivider();
    default:            return '';
  }
}

/* ─── Full email template ─────────────────────────────────── */

export function blocksToHtml(subject, blocks) {
  const bodyRows = blocks.map(renderBlock).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${BG_OUTER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_OUTER};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:20px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:${ACCENT};letter-spacing:-0.5px;">Joanluna Viajes</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BG_CARD};border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${bodyRows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:11px;color:#a8a29e;line-height:1.6;">
              Joanluna Viajes · Buenos Aires, Argentina<br />
              <a href="%UNSUBSCRIBE_URL%" style="color:#a8a29e;">Darse de baja</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Block default data factory ──────────────────────────── */

export const BLOCK_DEFAULTS = {
  header:      () => ({ imageUrl: '', eyebrow: '', headline: 'Título del mail', subtext: '' }),
  text:        () => ({ content: '' }),
  offer:       () => ({ offerId: '', offerData: null }),
  destination: () => ({ destinationId: '', destinationData: null }),
  cta:         () => ({ label: 'Ver oferta', url: '', style: 'primary' }),
  divider:     () => ({}),
};

export const BLOCK_LABELS = {
  header:      'Cabecera',
  text:        'Texto',
  offer:       'Oferta',
  destination: 'Destino',
  cta:         'Botón CTA',
  divider:     'Separador',
};
