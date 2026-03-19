import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  BreadcrumbsItem,
} from '@heroui/react';
import {
  LuMapPin,
  LuClock,
  LuPlane,
  LuStar,
  LuCheck,
  LuX,
  LuBedDouble,
  LuCalendarDays,
  LuShieldCheck,
  LuUsers,
  LuZap,
  LuInfo,
  LuListChecks,
  LuLuggage,
  LuSparkle,
} from 'react-icons/lu';
import { fetchOffer } from '@/lib/api';
import AirlineLogo from '@/components/ui/airline-logo';
import GalleryCollage from '@/components/inicio/ui/GalleryCollage';
import QuoteForm from '@/components/inicio/ui/QuoteForm';
import { formatCurrency } from '@/util/utils';

function formatDate(d) {
  if (!d) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(d));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer) return { title: 'Oferta no encontrada | Joanluna Viajes' };
  return {
    title: `${offer.title} | Joanluna Viajes`,
    description: offer.subtitle,
  };
}

/* ── Section heading — barra lateral + ícono + etiqueta ── */
function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-[3px] self-stretch rounded-full bg-accent shrink-0" />
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-accent shrink-0" />}
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/60">
          {children}
        </h2>
      </div>
    </div>
  );
}

/* ── Separador visual entre secciones ── */
function SectionDivider() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="w-1 h-1 rounded-full bg-accent/25 shrink-0" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export default async function OfferDetailPage({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer) notFound();

  const price =
    offer.pricing?.price ||
    offer.pricing?.finalPrice ||
    offer.pricing?.originalPrice;
  const originalPrice = offer.pricing?.originalPrice;
  const hasDiscount =
    offer.pricing?.discountPercentage > 0 &&
    originalPrice &&
    originalPrice > (price || 0);
  const currency = offer.pricing?.currency || 'USD';

  const originLabel = [offer.origin?.city, offer.origin?.country]
    .filter(Boolean)
    .join(', ');
  const destLabel = [offer.location?.city, offer.location?.country]
    .filter(Boolean)
    .join(', ');
  const hasRoute = originLabel && destLabel;

  const luggageItems = [
    offer.luggage?.personal && 'Artículo personal',
    offer.luggage?.carryOn && 'Carry-on',
    offer.luggage?.checked && 'Equipaje despachado',
  ].filter(Boolean);

  const hasIncludes = offer.includes?.length > 0;
  const hasNotIncludes = offer.notIncludes?.length > 0;
  const hasHighlights = offer.highlights?.length > 0;
  const hasHotel = Boolean(offer.hotel?.name);
  const hasAirline = Boolean(offer.airline?.name);
  const hasFlight = hasAirline || Boolean(offer.flight?.type);
  const hasAvailability =
    offer.availability?.startDate || offer.availability?.availableMonths;

  return (
    <div className="pb-20 md:pb-32">
      {/* Breadcrumbs */}
      <div className="mb-5">
        <Breadcrumbs size="sm" className="text-muted">
          <BreadcrumbsItem href="/">Inicio</BreadcrumbsItem>
          <BreadcrumbsItem href="/ofertas">Ofertas</BreadcrumbsItem>
          <BreadcrumbsItem>{offer.title}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* ── Title block ── */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {offer.isFeatured && (
            <span className="bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full">
              MÁS VENDIDA
            </span>
          )}
          {offer.isSpecialOffer && (
            <span className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full">
              OFERTA ESPECIAL
            </span>
          )}
          {hasDiscount && (
            <span className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full">
              -{offer.pricing.discountPercentage}% OFF
            </span>
          )}
        </div>

        <h1
          className="font-bold text-foreground leading-tight"
          style={{ fontSize: 'clamp(1.7rem, 4vw, 3rem)' }}
        >
          {offer.title}
        </h1>

        <div className="flex items-center gap-3 flex-wrap">
          {(offer.location?.city || offer.location?.country) && (
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <LuMapPin size={13} className="text-accent shrink-0" />
              {[offer.location.city, offer.location.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
          {offer.rating?.value > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-sm text-muted">
                <LuStar size={12} fill="currentColor" className="text-amber-400" />
                <strong className="text-foreground">{offer.rating.value}</strong>
                {offer.rating.reviewsCount > 0 && (
                  <span className="text-muted">({offer.rating.reviewsCount} reseñas)</span>
                )}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Gallery collage ── */}
      {offer.images?.length > 0 && (
        <div className="mb-6">
          <GalleryCollage images={offer.images} title={offer.title} />
        </div>
      )}

      {/* ── STATS STRIP — grid de píldoras ── */}
      {(offer.duration?.days > 0 || hasRoute || offer.flight?.type || offer.availability?.remainingSpots > 0 || hasDiscount) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {offer.duration?.days > 0 && (
            <StatCard icon={<LuClock size={15} className="text-accent" />} label="Duración">
              {offer.duration.days}d / {offer.duration.nights}n
            </StatCard>
          )}
          {hasRoute && (
            <StatCard icon={<LuPlane size={15} className="text-accent" />} label="Ruta" className="col-span-2 sm:col-span-1">
              {originLabel} → {destLabel}
            </StatCard>
          )}
          {offer.flight?.type && (
            <StatCard icon={<LuZap size={15} className="text-accent" />} label="Vuelo">
              {offer.flight.type === 'direct' ? 'Directo' : 'Con escala'}
            </StatCard>
          )}
          {offer.availability?.remainingSpots > 0 && (
            <StatCard icon={<LuUsers size={15} className="text-accent" />} label="Cupos">
              Quedan {offer.availability.remainingSpots}
            </StatCard>
          )}
          {hasDiscount && originalPrice && (
            <StatCard icon={<span className="text-accent font-bold text-xs">%</span>} label="Precio original">
              <span className="line-through text-muted">
                {formatCurrency({ amount: originalPrice, currency })}
              </span>
            </StatCard>
          )}
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_370px] gap-8 md:gap-12 items-start">
        {/* LEFT — Content */}
        <div className="space-y-2 min-w-0">

          {/* Description */}
          {offer.subtitle && (
            <>
              <ContentSection>
                <SectionHeading icon={LuInfo}>Sobre la experiencia</SectionHeading>
                <p className="text-muted leading-relaxed text-[15px]">
                  {offer.subtitle}
                </p>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Highlights */}
          {hasHighlights && (
            <>
              <ContentSection tinted>
                <SectionHeading icon={LuSparkle}>Puntos destacados</SectionHeading>
                <ul className="space-y-3">
                  {offer.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px] text-foreground pt-0.5 leading-snug">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Includes / Not includes */}
          {(hasIncludes || hasNotIncludes) && (
            <>
              <ContentSection>
                <SectionHeading icon={LuListChecks}>Qué incluye</SectionHeading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasIncludes && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/15 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <LuCheck size={12} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          Incluido
                        </span>
                      </div>
                      <ul className="space-y-2.5">
                        {offer.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                            <LuCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasNotIncludes && (
                    <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/15 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-rose-400 flex items-center justify-center shrink-0">
                          <LuX size={12} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          No incluido
                        </span>
                      </div>
                      <ul className="space-y-2.5">
                        {offer.notIncludes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-200">
                            <LuX size={13} className="text-rose-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Flight & Luggage */}
          {hasFlight && (
            <>
              <ContentSection tinted>
                <SectionHeading icon={LuPlane}>Detalles del vuelo</SectionHeading>
                <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
                  {hasAirline && (
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <span className="text-sm text-muted">Aerolínea</span>
                      <div className="flex items-center gap-2">
                        {offer.airline.iata && (
                          <AirlineLogo iata={offer.airline.iata} name={offer.airline.name} />
                        )}
                        <span className="font-semibold text-sm">{offer.airline.name}</span>
                        {offer.airline.iata && (
                          <span className="text-xs text-muted font-mono border border-border rounded px-1.5 py-0.5">
                            {offer.airline.iata}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {offer.flight?.type && (
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <span className="text-sm text-muted">Tipo de vuelo</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          offer.flight.type === 'direct'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {offer.flight.type === 'direct' ? '⚡ Directo' : '↩ Con escala'}
                      </span>
                    </div>
                  )}
                  {luggageItems.length > 0 && (
                    <div className="flex items-start justify-between gap-4 px-5 py-4">
                      <span className="text-sm text-muted shrink-0">Equipaje</span>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {luggageItems.map((item) => (
                          <span
                            key={item}
                            className="text-xs bg-surface-secondary border border-border rounded-full px-2.5 py-1 font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Hotel */}
          {hasHotel && (
            <>
              <ContentSection>
                <SectionHeading icon={LuBedDouble}>Alojamiento</SectionHeading>
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <LuBedDouble size={20} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base text-foreground">
                          {offer.hotel.name}
                        </h3>
                        {offer.hotel.stars > 0 && (
                          <span className="text-amber-400 text-sm leading-none">
                            {'★'.repeat(offer.hotel.stars)}
                          </span>
                        )}
                      </div>
                      {offer.hotel.roomType && (
                        <p className="text-xs text-muted mt-0.5">{offer.hotel.roomType}</p>
                      )}
                      {offer.hotel.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {offer.hotel.amenities.map((a) => (
                            <span
                              key={a}
                              className="text-xs bg-surface-secondary border border-border rounded-full px-2.5 py-1"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Availability dates */}
          {hasAvailability && (
            <>
              <ContentSection tinted>
                <SectionHeading icon={LuCalendarDays}>Fechas del viaje</SectionHeading>
                <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
                  {offer.availability.startDate && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm text-muted flex items-center gap-2">
                        <LuCalendarDays size={14} className="text-accent" /> Salida
                      </span>
                      <span className="font-semibold text-sm">
                        {formatDate(offer.availability.startDate)}
                      </span>
                    </div>
                  )}
                  {offer.availability.endDate && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm text-muted flex items-center gap-2">
                        <LuCalendarDays size={14} className="text-accent" /> Regreso
                      </span>
                      <span className="font-semibold text-sm">
                        {formatDate(offer.availability.endDate)}
                      </span>
                    </div>
                  )}
                  {offer.availability.availableMonths && !offer.availability.startDate && (
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm text-muted flex items-center gap-2">
                        <LuCalendarDays size={14} className="text-accent" /> Disponible
                      </span>
                      <span className="font-semibold text-sm">
                        {offer.availability.availableMonths}
                      </span>
                    </div>
                  )}
                </div>
              </ContentSection>
              <SectionDivider />
            </>
          )}

          {/* Cancellation policy */}
          <div className="rounded-2xl border border-border bg-surface-secondary/50 px-5 py-4 flex items-center gap-3 mt-2">
            <LuShieldCheck size={20} className="text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {offer.cancellationPolicy?.refundable
                  ? 'Reserva reembolsable'
                  : 'Reserva no reembolsable'}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Consultá las condiciones exactas al momento de la reserva.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT — Sticky quote form */}
        <QuoteForm offer={offer} />
      </div>
    </div>
  );
}

/* ── Contenedor de sección con padding uniforme y fondo opcional ── */
function ContentSection({ children, tinted = false }) {
  return (
    <div
      className={`rounded-2xl px-5 py-6 ${
        tinted
          ? 'bg-surface-secondary/60 border border-border/50'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

/* ── Stat card para el strip de estadísticas ── */
function StatCard({ icon, label, children, className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground leading-tight truncate">
          {children}
        </p>
      </div>
    </div>
  );
}
