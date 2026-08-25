import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  BreadcrumbsItem,
} from '@heroui/react';
import {
  LuMapPin,
  LuCheck,
  LuX,
  LuShieldCheck,
  LuSparkle,
  LuTag,
  LuArrowRight,
  LuBedDouble,
} from 'react-icons/lu';
import { fetchOffer } from '@/lib/api';
import AirlineLogo from '@/components/ui/airline-logo';
import GalleryCollage from '@/components/inicio/ui/GalleryCollage';
import QuoteForm from '@/components/inicio/ui/QuoteForm';

function formatDate(d) {
  if (!d) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(d));
}

function dateParts(d) {
  if (!d) return null;
  const date = new Date(d);
  return {
    day: new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date).replace('.', ''),
    year: new Intl.DateTimeFormat('es-AR', { year: 'numeric', timeZone: 'UTC' }).format(date),
  };
}

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-7 md:p-8 shadow-[0_1px_2px_rgba(18,36,59,.04),0_14px_30px_-18px_rgba(18,36,59,.16)]">
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return <h2 className="text-lg font-extrabold mb-5">{children}</h2>;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer) return { title: 'Oferta no encontrada' };
  return {
    title: offer.title,
    description: offer.subtitle,
    openGraph: {
      title: offer.title,
      description: offer.subtitle,
      images: offer.images?.[0]?.url ? [{ url: offer.images[0].url }] : [],
      type: 'website',
    },
    alternates: { canonical: `/ofertas/${slug}` },
  };
}

export default async function OfferDetailPage({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);
  if (!offer) notFound();

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

  const images = offer.images || [];
  const hotelImage = images.length > 1 ? images[4] || images[1] : null;

  const hasIncludes = offer.includes?.length > 0;
  const hasNotIncludes = offer.notIncludes?.length > 0;
  const hasHighlights = offer.highlights?.length > 0;
  const hasHotel = Boolean(offer.hotel?.name);
  const hasAirline = Boolean(offer.airline?.name);
  const hasFlight = hasAirline || Boolean(offer.flight?.type);
  const hasAvailability =
    offer.availability?.startDate || offer.availability?.availableMonths;

  return (
    <div className="pb-24 md:pb-32">

      {/* Breadcrumbs */}
      <div className="pt-6 mb-5">
        <Breadcrumbs size="sm" className="text-muted">
          <BreadcrumbsItem href="/">Inicio</BreadcrumbsItem>
          <BreadcrumbsItem href="/ofertas">Ofertas</BreadcrumbsItem>
          <BreadcrumbsItem>{offer.title}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* ============ HERO — photo mosaic ============ */}
      <div className="relative">
        {images.length > 0 ? (
          <GalleryCollage images={images} title={offer.title} />
        ) : (
          <div className="w-full h-[320px] rounded-3xl bg-surface-tertiary" />
        )}

        {(offer.isFeatured || offer.isSpecialOffer) && (
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2 pointer-events-none">
            {offer.isFeatured && (
              <span className="inline-flex items-center gap-1 bg-white text-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                <LuTag size={11} />
                Más vendida
              </span>
            )}
            {offer.isSpecialOffer && (
              <span className="inline-flex items-center gap-1 bg-white text-foreground text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                <LuSparkle size={11} />
                Oferta especial
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============ TITLE + FLOATING QUOTE CARD ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10 xl:gap-14 items-start mt-7">

        <div className="min-w-0">
          <p className="text-[13px] font-bold text-muted mb-2">
            {[offer.category, offer.duration?.days > 0 && `${offer.duration.days} días / ${offer.duration.nights} noches`]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <h1 className="font-extrabold tracking-tight leading-[1.05] mb-3" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)' }}>
            {offer.title}
          </h1>
          {(offer.location?.city || offer.location?.country) && (
            <div className="flex items-center gap-1.5 text-[15px] text-muted">
              <LuMapPin size={15} className="shrink-0" />
              {[offer.location.city, offer.location.country].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        <div className="xl:-mt-16 xl:row-span-2">
          <QuoteForm offer={offer} />
        </div>

        {/* ============ CONTENT CARDS ============ */}
        <div className="flex flex-col gap-5 min-w-0">

          {offer.subtitle && (
            <Card>
              <p className="text-[17px] leading-relaxed">{offer.subtitle}</p>
            </Card>
          )}

          {hasHighlights && (
            <Card>
              <CardTitle>Lo más destacado</CardTitle>
              <div>
                {offer.highlights.map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 py-3.5 ${i === 0 ? '' : 'border-t border-border'}`}>
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <LuSparkle size={16} className="text-accent" />
                    </div>
                    <span className="text-[15px]">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(hasIncludes || hasNotIncludes) && (
            <Card>
              <CardTitle>Qué incluye</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {hasIncludes && (
                  <div>
                    {offer.includes.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5 text-[14.5px]">
                        <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <LuCheck size={12} className="text-accent" strokeWidth={2.8} />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {hasNotIncludes && (
                  <div>
                    {offer.notIncludes.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5 text-[14.5px] text-muted">
                        <span className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center shrink-0">
                          <LuX size={11} strokeWidth={2.8} />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {hasFlight && (
            <Card>
              <CardTitle>Vuelo y equipaje</CardTitle>

              {hasRoute && (
                <div className="flex items-center gap-4 bg-background rounded-2xl px-6 py-5 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-muted mb-0.5">ORIGEN</p>
                    <p className="text-[17px] font-extrabold truncate">{offer.origin?.city || originLabel}</p>
                  </div>
                  <LuArrowRight size={22} className="text-accent shrink-0" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[11px] font-semibold text-muted mb-0.5">DESTINO</p>
                    <p className="text-[17px] font-extrabold truncate">{offer.location?.city || destLabel}</p>
                  </div>
                </div>
              )}

              {hasAirline && (
                <div className="flex items-center justify-between gap-4 py-3 border-t border-border">
                  <span className="text-sm text-muted">Aerolínea</span>
                  <div className="flex items-center gap-2">
                    {offer.airline.iata && (
                      <AirlineLogo iata={offer.airline.iata} name={offer.airline.name} />
                    )}
                    <span className="font-semibold text-sm">{offer.airline.name}</span>
                  </div>
                </div>
              )}
              {offer.flight?.type && (
                <div className="flex items-center justify-between gap-4 py-3 border-t border-border">
                  <span className="text-sm text-muted">Tipo de vuelo</span>
                  <span className="font-semibold text-sm">
                    {offer.flight.type === 'direct' ? 'Directo' : offer.flight.layover ? `Escala en ${offer.flight.layover}` : 'Con escala'}
                  </span>
                </div>
              )}
              {luggageItems.length > 0 && (
                <div className="flex items-start justify-between gap-4 py-3 border-t border-border">
                  <span className="text-sm text-muted shrink-0">Equipaje</span>
                  <span className="font-semibold text-sm text-right">{luggageItems.join(', ')}</span>
                </div>
              )}
            </Card>
          )}

          {hasHotel && (
            <Card>
              <CardTitle>Alojamiento</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-6 items-center">
                <div className="relative rounded-2xl overflow-hidden h-[130px]">
                  {hotelImage?.url ? (
                    <Image
                      src={hotelImage.url}
                      alt={hotelImage.alt || offer.hotel.name}
                      fill
                      className="object-cover"
                      sizes="170px"
                    />
                  ) : (
                    <div className="h-full w-full bg-accent/10 flex items-center justify-center">
                      <LuBedDouble size={32} className="text-accent" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-[17px] truncate">{offer.hotel.name}</h3>
                    {offer.hotel.stars > 0 && (
                      <span className="text-accent text-[13px] shrink-0">{'★'.repeat(offer.hotel.stars)}</span>
                    )}
                  </div>
                  {offer.hotel.address && (
                    <a
                      href={offer.hotel.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(offer.hotel.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-muted hover:text-accent transition-colors block mb-2"
                    >
                      {offer.hotel.address}
                    </a>
                  )}
                  {offer.hotel.amenities?.length > 0 && (
                    <p className="text-sm text-muted">{offer.hotel.amenities.join(' · ')}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {hasAvailability && (
            <Card>
              <CardTitle>Fechas del viaje</CardTitle>
              <div className="flex items-center gap-4">
                {offer.availability.startDate && (
                  <div className="flex-1 bg-background rounded-2xl px-5 py-4 text-center">
                    <p className="text-[11px] font-bold text-muted mb-1.5">SALIDA</p>
                    <p className="text-xl font-extrabold text-accent leading-none">{dateParts(offer.availability.startDate).day}</p>
                    <p className="text-[12px] text-muted mt-1">{dateParts(offer.availability.startDate).year}</p>
                  </div>
                )}
                {offer.availability.startDate && offer.availability.endDate && (
                  <LuArrowRight size={18} className="text-border shrink-0" />
                )}
                {offer.availability.endDate && (
                  <div className="flex-1 bg-background rounded-2xl px-5 py-4 text-center">
                    <p className="text-[11px] font-bold text-muted mb-1.5">REGRESO</p>
                    <p className="text-xl font-extrabold text-accent leading-none">{dateParts(offer.availability.endDate).day}</p>
                    <p className="text-[12px] text-muted mt-1">{dateParts(offer.availability.endDate).year}</p>
                  </div>
                )}
                {!offer.availability.startDate && offer.availability.availableMonths && (
                  <div className="flex-1 bg-background rounded-2xl px-5 py-4 text-center">
                    <p className="text-[11px] font-bold text-muted mb-1.5">DISPONIBLE</p>
                    <p className="text-lg font-extrabold">{offer.availability.availableMonths}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* cancellation footnote */}
          <div className="flex items-start gap-2.5 px-1 text-muted text-[13px]">
            <LuShieldCheck size={15} className="text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">
                {offer.cancellationPolicy?.refundable ? 'Reserva reembolsable' : 'Reserva no reembolsable'}.
              </span>{' '}
              Consultá las condiciones exactas al momento de la reserva.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
