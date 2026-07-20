'use client';

import Link from 'next/link';
import {
  LuX, LuMapPin, LuCalendar, LuClock, LuBriefcase,
  LuCheck, LuPlane, LuStar, LuBuilding, LuTag,
  LuPencil, LuArrowUpRight, LuPackage, LuInfo,
  LuFlame, LuGift,
} from 'react-icons/lu';
import PreviewPanel from './preview-panel';
import PreviewPanelHeader from './preview-panel-header';

/* ─── Helpers ───────────────────────────────────────────────── */

function formatPrice(amount, currency) {
  if (amount == null) return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function buildLuggageItems(luggage) {
  return [
    luggage?.personal && 'Artículo personal',
    luggage?.carryOn && 'Carry-on',
    luggage?.checked && 'Despachado',
  ].filter(Boolean);
}

/* ─── Sub-components ────────────────────────────────────────── */

function Row({ label, children }) {
  return (
    <div className='flex gap-4 border-b border-default py-2 last:border-0'>
      <span className='w-28 shrink-0 pt-0.5 text-xs text-muted'>{label}</span>
      <span className='min-w-0 flex-1 text-sm'>{children}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className='px-5 py-4'>
      <div className='mb-2.5 flex items-center gap-1.5'>
        {Icon && <Icon className='h-3 w-3 text-muted' />}
        <p className='text-[11px] font-semibold uppercase tracking-wide text-muted'>{title}</p>
      </div>
      {children}
    </div>
  );
}

function StarRating({ stars }) {
  if (!stars) return <span className='text-sm text-muted'>—</span>;
  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <LuStar
          key={i}
          className={`h-3 w-3 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-surface-secondary text-surface-secondary'}`}
        />
      ))}
      <span className='ml-1.5 text-[11px] font-medium text-muted'>{stars}/5</span>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */

export default function OfferPreviewDrawer({ offer, isOpen, onClose }) {
  if (!offer) return null;

  const pricing      = offer.pricing      || {};
  const availability = offer.availability || {};
  const hotel        = offer.hotel        || {};
  const origin       = offer.origin       || {};
  const airline      = offer.airline      || {};
  const flight       = offer.flight       || {};
  const luggage      = offer.luggage      || {};
  const cover        = offer.images?.find((img) => img.isCover)?.url || offer.images?.[0]?.url;

  const mainPrice   = pricing.finalPrice || pricing.price;
  const origPrice   = pricing.originalPrice;
  const hasDiscount = origPrice && mainPrice && origPrice > mainPrice;
  const discountPct = hasDiscount
    ? (pricing.discountPercentage ?? Math.round(((origPrice - mainPrice) / origPrice) * 100))
    : null;
  const luggageItems = buildLuggageItems(luggage);
  const originCode   = origin.iata || origin.city?.slice(0, 3).toUpperCase() || '???';
  const destCode     = offer.location?.iata || offer.location?.city?.slice(0, 3).toUpperCase() || '???';
  const lowStock     = availability.remainingSpots != null && availability.remainingSpots <= 3;

  const tags = [];
  if (offer.isFeatured) tags.push({ label: 'Destacada', icon: LuStar });
  if (offer.isSpecialOffer) tags.push({ label: 'Especial', icon: LuGift });
  if (offer.isPopular) tags.push({ label: 'Popular', icon: LuFlame });
  if (availability.limitedSpots) tags.push({ label: 'Pocos cupos', tone: 'warning' });

  return (
    <PreviewPanel isOpen={isOpen} onClose={onClose}>
      <PreviewPanelHeader
        image={cover}
        fallbackIcon={LuPlane}
        title={offer.title}
        subtitle={offer.subtitle}
        status={{
          label: offer.status === 'published' ? 'Publicado' : 'Borrador',
          tone: offer.status === 'published' ? 'success' : 'neutral',
        }}
        meta={offer.location ? [[offer.location.city, offer.location.country].filter(Boolean).join(', ')] : []}
        tags={tags}
        onClose={onClose}
      />

      <div className='min-h-0 flex-1 divide-y divide-default overflow-y-auto'>

        {/* ── Resumen ── */}
        <Section title='Resumen'>
          <Row label='Precio'>
            <span className='font-semibold tabular-nums'>{formatPrice(mainPrice, pricing.currency) || '—'}</span>
            {hasDiscount && (
              <>
                <span className='ml-2 text-xs text-muted line-through tabular-nums'>{formatPrice(origPrice, pricing.currency)}</span>
                <span className='ml-1.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'>
                  -{discountPct}%
                </span>
              </>
            )}
          </Row>
          <Row label='Duración'>{offer.duration ? `${offer.duration.days}d / ${offer.duration.nights}n` : '—'}</Row>
          <Row label='Cupos'>
            <span className={lowStock ? 'font-semibold text-rose-600' : ''}>
              {availability.remainingSpots != null ? availability.remainingSpots : '—'}
            </span>
          </Row>
        </Section>

        {/* ── Vuelo ── */}
        <Section title='Vuelo' icon={LuPlane}>
          <div className='overflow-hidden rounded-xl border border-default'>
            <div className='flex items-center gap-3 px-4 pb-3 pt-3.5'>
              <div className='min-w-[44px] text-center'>
                <p className='font-mono text-xl font-black leading-none tracking-tight'>{originCode}</p>
                <p className='mt-1 text-[10px] leading-tight text-muted'>{origin.city || origin.country || '—'}</p>
              </div>
              <div className='flex flex-1 flex-col items-center gap-1'>
                <div className='flex w-full items-center'>
                  <div className='h-px flex-1 border-t-2 border-dashed border-muted/25' />
                  <LuPlane className='mx-1.5 h-3 w-3 shrink-0 text-accent' />
                  <div className='h-px flex-1 border-t-2 border-dashed border-muted/25' />
                </div>
                <span className='text-[10px] font-medium text-muted'>
                  {flight.type === 'stops'
                    ? flight.layover ? `Escala en ${flight.layover}` : 'Con escala'
                    : 'Directo'}
                </span>
              </div>
              <div className='min-w-[44px] text-center'>
                <p className='font-mono text-xl font-black leading-none tracking-tight'>{destCode}</p>
                <p className='mt-1 text-[10px] leading-tight text-muted'>{offer.location?.city || '—'}</p>
              </div>
            </div>
            {(airline.name || luggageItems.length > 0) && (
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-default bg-surface-secondary/50 px-4 py-2.5'>
                {airline.name && (
                  <span className='flex items-center gap-1.5 text-xs'>
                    {airline.iata && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://pics.avs.io/60/60/${airline.iata}.png`}
                        alt=''
                        className='h-5 w-5 object-contain'
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className='font-medium text-foreground'>{airline.name}</span>
                  </span>
                )}
                {luggageItems.length > 0 && (
                  <span className='flex items-center gap-1.5 text-xs text-muted'>
                    <LuBriefcase className='h-3 w-3 shrink-0 text-accent/60' />
                    {luggageItems.join(' · ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* ── Fechas ── */}
        {(availability.startDate || availability.endDate) && (
          <Section title='Fechas' icon={LuCalendar}>
            <div className='grid grid-cols-2 gap-2.5'>
              <div className='rounded-lg border border-default p-2.5'>
                <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted'>Salida</p>
                <p className='text-sm font-semibold'>{formatDate(availability.startDate) || '—'}</p>
              </div>
              <div className='rounded-lg border border-default p-2.5'>
                <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted'>Regreso</p>
                <p className='text-sm font-semibold'>{formatDate(availability.endDate) || '—'}</p>
              </div>
            </div>
            {offer.duration && (
              <p className='mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted'>
                <LuClock className='h-3 w-3' />
                {offer.duration.days} días · {offer.duration.nights} noches
              </p>
            )}
          </Section>
        )}

        {/* ── Alojamiento ── */}
        {(hotel.name || hotel.stars) && (
          <Section title='Alojamiento' icon={LuBuilding}>
            <div className='space-y-2'>
              <div className='flex items-start justify-between gap-3'>
                <p className='font-semibold leading-snug'>{hotel.name || '—'}</p>
                <StarRating stars={hotel.stars} />
              </div>
              {hotel.address && (
                <a
                  href={hotel.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(hotel.address)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent'
                >
                  <LuMapPin className='h-3 w-3 shrink-0' />
                  {hotel.address}
                </a>
              )}
              {hotel.amenities?.length > 0 && (
                <div className='flex flex-wrap gap-1.5 pt-0.5'>
                  {hotel.amenities.map((a, i) => (
                    <span key={i} className='rounded-md bg-surface-secondary px-1.5 py-0.5 text-[11px] font-medium text-foreground/70'>
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Incluye / No incluye ── */}
        {(offer.includes?.length > 0 || offer.notIncludes?.length > 0) && (
          <Section title='Contenido' icon={LuPackage}>
            <div className='space-y-2.5'>
              {offer.includes?.length > 0 && (
                <ul className='space-y-1.5'>
                  {offer.includes.map((item, i) => (
                    <li key={i} className='flex items-start gap-1.5 text-[13px] leading-snug'>
                      <LuCheck className='mt-px h-3.5 w-3.5 shrink-0 text-emerald-500' />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {offer.notIncludes?.length > 0 && (
                <ul className='space-y-1.5'>
                  {offer.notIncludes.map((item, i) => (
                    <li key={i} className='flex items-start gap-1.5 text-[13px] leading-snug text-muted'>
                      <LuX className='mt-px h-3.5 w-3.5 shrink-0 text-rose-400' />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        )}

        {/* ── Highlights & Tags ── */}
        {(offer.highlights?.length > 0 || offer.tags?.length > 0) && (
          <Section title='Highlights & Tags' icon={LuTag}>
            {offer.highlights?.length > 0 && (
              <div className='mb-2.5 flex flex-wrap gap-1.5'>
                {offer.highlights.map((h, i) => (
                  <span key={i} className='rounded-md bg-accent/10 px-2 py-0.5 text-[12px] font-semibold text-accent'>
                    {h}
                  </span>
                ))}
              </div>
            )}
            {offer.tags?.length > 0 && (
              <div className='flex flex-wrap gap-1.5'>
                {offer.tags.map((t, i) => (
                  <span key={i} className='rounded-md bg-surface-secondary px-2 py-0.5 text-[12px] font-medium text-muted'>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Metadatos ── */}
        <Section title='Metadatos' icon={LuInfo}>
          {[
            { label: 'ID',          value: offer.id,               mono: true  },
            { label: 'Slug',        value: offer.slug,             mono: true  },
            { label: 'Categoría',   value: offer.category,         mono: false },
            { label: 'Creado',      value: formatDate(offer.createdAt),  mono: false },
            { label: 'Actualizado', value: formatDate(offer.updatedAt),  mono: false },
          ].filter((r) => r.value).map(({ label, value, mono }) => (
            <Row key={label} label={label}>
              {mono ? (
                <code className='truncate rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{value}</code>
              ) : (
                <span className='truncate text-sm'>{value}</span>
              )}
            </Row>
          ))}
        </Section>

      </div>

      <div className='flex shrink-0 gap-2.5 border-t border-default bg-surface px-5 py-3'>
        <Link
          href={`/admin/ofertas/${offer.slug}/editar`}
          onClick={onClose}
          className='flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-semibold text-accent-foreground'
        >
          <LuPencil className='h-3.5 w-3.5' />
          Editar oferta
        </Link>
        <Link
          href={`/ofertas/${offer.slug}`}
          target='_blank'
          className='flex h-9 items-center justify-center gap-1.5 rounded-lg border border-default px-3 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
        >
          Ver pública
          <LuArrowUpRight className='h-3.5 w-3.5' />
        </Link>
      </div>
    </PreviewPanel>
  );
}
