'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuFlame, LuPlane } from 'react-icons/lu';
import AirlineLogo from '@/components/ui/airline-logo';

function getPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatAmount(amount) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(amount);
}

export default function OfferTicketCard({ offer }) {
  const {
    slug,
    title,
    images = [],
    location,
    pricing,
    duration,
    hotel,
    airline,
    flight,
    availability,
  } = offer;

  const cover = images.find((img) => img.isCover) || images[0];
  const price = getPrice(offer);
  const hasPrice = price > 0;
  const hasDiscount =
    pricing?.discountPercentage > 0 &&
    pricing?.originalPrice &&
    pricing.originalPrice > price;

  const remainingSpots = availability?.remainingSpots;
  const lowStock = remainingSpots > 0 && remainingSpots <= 5;

  const meta = [
    duration?.days > 0 && `${duration.days}D/${duration.nights ?? duration.days - 1}N`,
    flight?.type && (flight.type === 'direct' ? 'DIRECTO' : 'C/ESCALA'),
    hotel?.stars > 0 && `${hotel.stars}★ HOTEL`,
  ].filter(Boolean);

  return (
    <Link
      href={`/ofertas/${slug}`}
      data-offer-card
      className="group block h-full w-[300px] shrink-0 snap-start sm:w-[340px]"
    >
      <article className="relative flex h-full overflow-hidden rounded-[22px] border border-border bg-surface shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/25">
        {/* Coupon stub — photo */}
        <div className="relative w-[36%] shrink-0 overflow-hidden">
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt || title}
              fill
              sizes="140px"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.12]"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />

          {hasDiscount && (
            <div className="absolute -left-9 top-3 w-32 rotate-[-45deg] bg-accent py-1 text-center text-[10px] font-extrabold tracking-wide text-accent-foreground shadow-md">
              -{pricing.discountPercentage}%
            </div>
          )}

          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/90 truncate">
              {location?.city}
            </p>
          </div>

          <div className="absolute -right-3.5 bottom-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-white shadow-md">
            {airline?.iata ? (
              <AirlineLogo iata={airline.iata} name={airline.name} className="h-5 w-5 object-contain" />
            ) : (
              <LuPlane size={13} className="text-foreground" />
            )}
          </div>
        </div>

        {/* Perforation */}
        <div className="relative w-px shrink-0 bg-transparent">
          <div className="absolute inset-y-2 left-0 border-l-2 border-dashed border-border" />
          <span className="absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          <span className="absolute bottom-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
        </div>

        {/* Coupon stub — details */}
        <div className="flex flex-1 flex-col justify-between gap-2.5 p-4 pl-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 text-[15px] font-extrabold leading-tight text-foreground transition-colors duration-300 group-hover:text-accent">
              {title}
            </h3>
            {meta.length > 0 && (
              <p className="font-mono text-[10px] font-semibold tracking-wide text-muted">
                {meta.join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2 border-t border-dashed border-border pt-2.5">
            <div>
              {lowStock ? (
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <LuFlame size={11} className="animate-pulse" />
                  Quedan {remainingSpots}
                </p>
              ) : hasDiscount ? (
                <p className="text-[11px] text-muted line-through">
                  {pricing.currency} {formatAmount(pricing.originalPrice)}
                </p>
              ) : (
                <span className="block h-[14px]" />
              )}

              {hasPrice ? (
                <p className="text-lg font-extrabold leading-tight text-accent">
                  {pricing.currency} {formatAmount(price)}
                </p>
              ) : (
                <p className="text-sm font-semibold italic text-muted">Consultar</p>
              )}
            </div>

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-default text-foreground transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-accent group-hover:text-accent-foreground group-hover:translate-x-0.5">
              <LuArrowRight size={15} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
