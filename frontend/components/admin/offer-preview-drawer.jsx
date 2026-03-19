'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import {
  LuX, LuMapPin, LuCalendar, LuClock, LuBriefcase,
  LuCheck, LuPlane, LuStar, LuBuilding, LuTag,
  LuPencil, LuArrowUpRight, LuPackage, LuPercent,
  LuInfo,
} from 'react-icons/lu';

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

function StarRating({ stars }) {
  if (!stars) return <span className="text-muted text-sm">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <LuStar
          key={i}
          className={`h-3 w-3 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-surface-secondary text-surface-secondary'}`}
        />
      ))}
      <span className="ml-1.5 text-[11px] text-muted font-medium">{stars}/5</span>
    </div>
  );
}

function StatusBadge({ children, variant }) {
  const styles = {
    published: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    draft:     'bg-white/10 text-white/60 border border-white/20',
    featured:  'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    popular:   'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    special:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    lowstock:  'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${styles[variant] || styles.draft}`}>
      {children}
    </span>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
          <Icon className="h-3 w-3 text-accent" />
        </div>
      )}
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */

export default function OfferPreviewDrawer({ offer, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Modal container — centered */}
      <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`relative flex w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          flex-col md:flex-row
          h-[92vh] md:h-[85vh] max-h-[820px]`}
        >

          {/* ── LEFT: Image panel ──────────────────────────── */}
          <div className="relative md:w-[42%] shrink-0 h-48 md:h-auto overflow-hidden bg-zinc-900">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={offer.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
                <LuMapPin className="h-14 w-14 text-muted/20" />
              </div>
            )}

            {/* Layered gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 hidden md:block" />

            {/* Status badges — top left */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
              <StatusBadge variant={offer.status === 'published' ? 'published' : 'draft'}>
                {offer.status === 'published' ? '● Publicado' : '○ Borrador'}
              </StatusBadge>
              {offer.isFeatured     && <StatusBadge variant="featured">Destacada</StatusBadge>}
              {offer.isSpecialOffer && <StatusBadge variant="special">Especial</StatusBadge>}
              {offer.isPopular      && <StatusBadge variant="popular">Popular</StatusBadge>}
              {availability.limitedSpots && <StatusBadge variant="lowstock">Pocos cupos</StatusBadge>}
            </div>

            {/* Title + location — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
              {offer.subtitle && (
                <p className="text-white/50 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5">
                  {offer.subtitle}
                </p>
              )}
              <h2 className="text-white font-bold text-2xl leading-snug tracking-tight drop-shadow-sm">
                {offer.title}
              </h2>
              {offer.location && (
                <p className="flex items-center gap-1.5 text-white/60 text-xs mt-2">
                  <LuMapPin className="h-3 w-3 shrink-0" />
                  {[offer.location.city, offer.location.country].filter(Boolean).join(', ')}
                  {offer.location.airport && (
                    <span className="font-mono text-white/35 text-[10px]">· {offer.location.airport}</span>
                  )}
                </p>
              )}

              {/* Quick stats pills — visible on desktop inside image */}
              <div className="hidden md:flex flex-wrap gap-2 mt-4">
                {mainPrice && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/15 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                    {formatPrice(mainPrice, pricing.currency)}
                    {hasDiscount && (
                      <span className="text-emerald-400 text-[10px]">-{discountPct}%</span>
                    )}
                  </span>
                )}
                {offer.duration?.days && (
                  <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/80 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <LuClock className="h-3 w-3" />
                    {offer.duration.days}d / {offer.duration.nights}n
                  </span>
                )}
                {availability.remainingSpots != null && (
                  <span className={`inline-flex items-center gap-1 backdrop-blur-md border px-3 py-1.5 rounded-full text-xs font-semibold ${availability.remainingSpots <= 3 ? 'bg-rose-500/20 border-rose-400/30 text-rose-300' : 'bg-white/10 border-white/15 text-white/80'}`}>
                    {availability.remainingSpots} cupos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Content panel ───────────────────────── */}
          <div className="flex flex-col flex-1 bg-surface min-h-0">

            {/* Top bar */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-default">
              <span className="text-[11px] font-bold text-muted uppercase tracking-[0.18em]">
                Resumen de oferta
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            {/* Quick stats strip — mobile only (desktop shows inside image) */}
            {(() => {
              const stats = [
                { label: 'Precio',    value: mainPrice ? formatPrice(mainPrice, pricing.currency) : null },
                { label: 'Duración',  value: offer.duration?.days && availability.startDate && availability.endDate ? `${offer.duration.days}d` : null },
                { label: 'Cupos',     value: availability.remainingSpots ?? null, red: availability.remainingSpots != null && availability.remainingSpots <= 3 },
                { label: 'Hotel',     value: hotel.stars ? `${hotel.stars}★` : hotel.name ? hotel.name : null },
              ].filter((s) => s.value != null);
              if (!stats.length) return null;
              const cols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
              return (
                <div className={`md:hidden grid ${cols[stats.length]} divide-x divide-default border-b border-default bg-surface-secondary/40 shrink-0`}>
                  {stats.map(({ label, value, red }) => (
                    <div key={label} className="flex flex-col items-center justify-center py-2.5 gap-0.5">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
                      <span className={`text-sm font-bold tabular-nums truncate max-w-full px-1 ${red ? 'text-rose-500' : 'text-foreground'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Scrollable sections */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-5 space-y-6">

                {/* ── Vuelo ── */}
                <div>
                  <SectionHeader icon={LuPlane}>Vuelo</SectionHeader>
                  <div className="rounded-2xl border border-default bg-surface-secondary/30 overflow-hidden">
                    <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-2xl font-black tracking-tight font-mono leading-none">{originCode}</p>
                        <p className="text-[10px] text-muted mt-1 leading-tight">{origin.city || origin.country || '—'}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-center w-full">
                          <div className="flex-1 h-px border-t-2 border-dashed border-muted/25" />
                          <div className="mx-2 w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <LuPlane className="h-3.5 w-3.5 text-accent" />
                          </div>
                          <div className="flex-1 h-px border-t-2 border-dashed border-muted/25" />
                        </div>
                        <span className="text-[10px] text-muted font-medium">
                          {flight.type === 'stops'
                            ? flight.layover ? `Escala en ${flight.layover}` : 'Con escala'
                            : 'Directo'}
                        </span>
                      </div>
                      <div className="text-center min-w-[48px]">
                        <p className="text-2xl font-black tracking-tight font-mono leading-none">{destCode}</p>
                        <p className="text-[10px] text-muted mt-1 leading-tight">{offer.location?.city || '—'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 border-t border-default bg-surface-secondary/50">
                      {airline.name && (
                        <span className="flex items-center gap-2 text-xs">
                          {airline.iata && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`https://pics.avs.io/60/60/${airline.iata}.png`}
                              alt={airline.name}
                              className="h-6 w-6 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <span className="font-semibold text-foreground">{airline.name}</span>
                          {airline.iata && (
                            <code className="text-[10px] font-mono bg-surface border border-default px-1.5 py-0.5 rounded text-muted">
                              {airline.iata}
                            </code>
                          )}
                        </span>
                      )}
                      {luggageItems.length > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <LuBriefcase className="h-3 w-3 text-accent/60 shrink-0" />
                          {luggageItems.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Fechas ── */}
                {(availability.startDate || availability.endDate) && (
                  <div>
                    <SectionHeader icon={LuCalendar}>Fechas</SectionHeader>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl border border-default bg-surface-secondary/30 p-3">
                        <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Salida</p>
                        <p className="text-sm font-bold">{formatDate(availability.startDate) || '—'}</p>
                      </div>
                      <div className="rounded-xl border border-default bg-surface-secondary/30 p-3">
                        <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Regreso</p>
                        <p className="text-sm font-bold">{formatDate(availability.endDate) || '—'}</p>
                      </div>
                    </div>
                    {offer.duration && (
                      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted mt-2">
                        <LuClock className="h-3 w-3" />
                        {offer.duration.days} días · {offer.duration.nights} noches
                      </p>
                    )}
                  </div>
                )}

                {/* ── Precio ── */}
                {mainPrice && (
                  <div>
                    <SectionHeader icon={LuPercent}>Precio</SectionHeader>
                    <div className="rounded-2xl border border-default bg-surface-secondary/30 p-4">
                      <div className="flex items-end justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">
                            {pricing.pricePer || 'Por persona'}
                          </p>
                          <p className="text-3xl font-black tabular-nums tracking-tight">
                            {formatPrice(mainPrice, pricing.currency)}
                          </p>
                        </div>
                        {hasDiscount && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-muted line-through tabular-nums">
                              {formatPrice(origPrice, pricing.currency)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              -{discountPct}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      {pricing.price && pricing.finalPrice && pricing.price !== pricing.finalPrice && (
                        <p className="text-[11px] text-muted mt-2.5 pt-2.5 border-t border-default">
                          Precio base: <span className="font-medium">{formatPrice(pricing.price, pricing.currency)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Alojamiento ── */}
                {(hotel.name || hotel.stars) && (
                  <div>
                    <SectionHeader icon={LuBuilding}>Alojamiento</SectionHeader>
                    <div className="rounded-2xl border border-default bg-surface-secondary/30 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-[15px] leading-snug">{hotel.name || '—'}</p>
                        <StarRating stars={hotel.stars} />
                      </div>
                      {hotel.address && (
                        <a
                          href={hotel.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(hotel.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
                        >
                          <LuMapPin className="h-3 w-3 shrink-0" />
                          {hotel.address}
                        </a>
                      )}
                      {hotel.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {hotel.amenities.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Incluye / No incluye ── */}
                {(offer.includes?.length > 0 || offer.notIncludes?.length > 0) && (
                  <div>
                    <SectionHeader icon={LuPackage}>Contenido</SectionHeader>
                    <div className="grid grid-cols-2 gap-2.5">
                      {offer.includes?.length > 0 && (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-3">
                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2.5">Incluye</p>
                          <ul className="space-y-1.5">
                            {offer.includes.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug">
                                <LuCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-px" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {offer.notIncludes?.length > 0 && (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-900/10 p-3">
                          <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2.5">No incluye</p>
                          <ul className="space-y-1.5">
                            {offer.notIncludes.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug">
                                <LuX className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-px" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Highlights & Tags ── */}
                {(offer.highlights?.length > 0 || offer.tags?.length > 0) && (
                  <div>
                    <SectionHeader icon={LuTag}>Highlights & Tags</SectionHeader>
                    {offer.highlights?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {offer.highlights.map((h, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-accent/10 text-accent border border-accent/20">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    {offer.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {offer.tags.map((t, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-secondary text-muted border border-default">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Metadatos ── */}
                <div>
                  <SectionHeader icon={LuInfo}>Metadatos</SectionHeader>
                  <div className="rounded-xl border border-default bg-surface-secondary/20 divide-y divide-default overflow-hidden">
                    {[
                      { label: 'ID',          value: offer.id,               mono: true  },
                      { label: 'Slug',        value: offer.slug,             mono: true  },
                      { label: 'Categoría',   value: offer.category,         mono: false },
                      { label: 'Creado',      value: formatDate(offer.createdAt),  mono: false },
                      { label: 'Actualizado', value: formatDate(offer.updatedAt),  mono: false },
                    ].filter((r) => r.value).map(({ label, value, mono }) => (
                      <div key={label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="text-[11px] text-muted shrink-0 font-medium">{label}</span>
                        {mono ? (
                          <code className="text-[11px] font-mono bg-surface border border-default px-1.5 py-0.5 rounded text-foreground/70 truncate max-w-[200px]">
                            {value}
                          </code>
                        ) : (
                          <span className="text-[12px] truncate">{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 border-t border-default px-4 py-3 flex gap-2.5 bg-surface">
              <Link
                href={`/admin/ofertas/${offer.slug}/editar`}
                onClick={onClose}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
              >
                <LuPencil className="h-3.5 w-3.5" />
                Editar oferta
              </Link>
              <Link
                href={`/ofertas/${offer.slug}`}
                target="_blank"
                className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-default text-[13px] font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
              >
                Ver pública
                <LuArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
