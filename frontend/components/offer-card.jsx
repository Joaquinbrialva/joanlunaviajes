'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuBedDouble, LuClock3, LuMapPin, LuPlane, LuTag } from 'react-icons/lu';
import { getLogoUrl } from '@/lib/airlines';

function formatCardPrice(amount, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0,
  }).format(amount);
}

export default function OfferCard({ offer }) {
  const price = offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
  const hasPrice = price > 0;
  const originalPrice = offer.pricing?.originalPrice;
  const discount = offer.pricing?.discountPercentage;
  const hasDiscount = discount > 0 && originalPrice && originalPrice > price;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const currency = offer.pricing?.currency || 'USD';
  const keyIncludes = (offer.includes || []).filter(Boolean).slice(0, 3);

  return (
    <Link
      href={`/ofertas/${offer.slug}`}
      className="group block h-full"
    >
      <article className="h-full bg-surface rounded-2xl overflow-hidden flex flex-col border border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 hover:border-brand-primary/25">

        {/* Imagen */}
        <div className="relative h-52 overflow-hidden shrink-0">
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt || offer.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="h-full w-full bg-surface-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

          {/* Location */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1">
            <LuMapPin size={9} className="text-white/80 shrink-0" />
            <span className="text-white text-[10px] font-semibold truncate max-w-[150px]">
              {offer.location?.city}, {offer.location?.country}
            </span>
          </div>

          {/* Badge */}
          {hasDiscount ? (
            <span className="absolute top-3 right-3 bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-brand-primary/30">
              -{discount}% OFF
            </span>
          ) : offer.isFeatured ? (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full">
              Más vendida
            </span>
          ) : null}
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-secondary border-b border-border">
          {offer.duration?.days > 0 && offer.availability?.startDate && offer.availability?.endDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted shrink-0">
              <LuClock3 size={10} />
              {offer.duration.days} días
            </span>
          )}
          {offer.airline?.name && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted truncate">
              {offer.airline.iata ? (
                <img
                  src={getLogoUrl(offer.airline.iata)}
                  alt=''
                  className='h-4 w-6 object-contain shrink-0'
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <LuPlane size={10} className="shrink-0" />
              )}
              {offer.airline.name}
            </span>
          )}
          {offer.hotel?.stars > 0 && !offer.airline?.name && (
            <span className="flex items-center gap-1 text-[11px] text-muted shrink-0">
              <LuBedDouble size={10} />
              {'★'.repeat(offer.hotel.stars)}
            </span>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col grow">
          <h3
            className="leading-snug line-clamp-2 font-bold group-hover:text-brand-primary transition-colors duration-300 mb-2"
            style={{ fontSize: '1rem' }}
          >
            {offer.title}
          </h3>

          {/* Includes tags */}
          {keyIncludes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-auto mt-1">
              {keyIncludes.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-muted bg-surface-tertiary rounded-full px-2 py-0.5 leading-none"
                >
                  <LuTag size={8} className="text-brand-primary/70 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-end justify-between gap-2 mt-4 pt-3 border-t border-border">
            <div>
              {hasPrice && hasDiscount && originalPrice && (
                <p className="text-xs text-muted line-through leading-none mb-0.5">
                  {formatCardPrice(originalPrice, currency)}
                </p>
              )}
              {hasPrice ? (
                <>
                  <p className="text-xl font-bold text-brand-primary leading-none">
                    {formatCardPrice(price, currency)}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    /{offer.pricing?.pricePer || 'persona'}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-muted italic">Consultar precio</p>
              )}
            </div>
            <span
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-primary px-4 text-[11px] font-semibold text-white shadow-md shadow-brand-primary/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-primary/30 group-hover:opacity-90 shrink-0"
            >
              {hasPrice ? 'Ver oferta' : 'Consultar'} <LuArrowRight size={12} />
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}
