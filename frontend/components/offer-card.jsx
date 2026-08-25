'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuArrowUpRight, LuPlaneTakeoff, LuTag } from 'react-icons/lu';
import { getLogoUrl } from '@/lib/airlines';

function formatPrice(amount, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0,
  }).format(amount);
}

export default function OfferCard({ offer }) {
  const price = offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
  const hasPrice = price > 0;
  const currency = offer.pricing?.currency || 'USD';
  const discount = offer.pricing?.discountPercentage;
  const originalPrice = offer.pricing?.originalPrice;
  const hasDiscount = discount > 0 && originalPrice && originalPrice > price;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const origin = offer.origin?.city || offer.origin?.iata || 'BUE';
  const destCity = offer.location?.city || offer.title;
  const keyIncludes = (offer.includes || []).filter(Boolean).slice(0, 2);

  return (
    <Link href={`/ofertas/${offer.slug}`} className='group block h-full'>
      <article className='relative flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-surface transition-shadow duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-2xl hover:shadow-black/10 hover:border-brand-primary/30'>

        {/* Franja imagen */}
        <div className='relative h-52 shrink-0 overflow-hidden'>
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt || offer.title}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'
              className='object-cover'
            />
          ) : (
            <div className='h-full w-full bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' />

          {(hasDiscount || offer.isFeatured) && (
            <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-lg ${
              hasDiscount ? 'bg-brand-tertiary text-brand-tertiary-foreground' : 'bg-brand-secondary text-brand-secondary-foreground'
            }`}>
              {hasDiscount ? `-${discount}%` : 'Más vendida'}
            </span>
          )}

          {/* Ruta estilo boarding pass */}
          <div className='absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-black/45 backdrop-blur-md px-3 py-1.5 text-white'>
            <span className='text-[11px] font-black tracking-wide shrink-0'>{origin}</span>
            <span className='flex-1 h-px bg-white/30' />
            <LuPlaneTakeoff size={11} className='shrink-0 text-white' />
            <span className='flex-1 h-px bg-white/30' />
            <span className='text-[11px] font-black tracking-wide truncate max-w-[130px]'>{destCity}</span>
          </div>
        </div>

        {/* Perforación tipo ticket */}
        <div className='relative h-0'>
          <div className='absolute inset-x-0 top-0 border-t border-dashed border-border' />
          <span className='absolute -left-[9px] -top-[9px] w-[18px] h-[18px] rounded-full bg-background' aria-hidden='true' />
          <span className='absolute -right-[9px] -top-[9px] w-[18px] h-[18px] rounded-full bg-background' aria-hidden='true' />
        </div>

        {/* Talón */}
        <div className='flex grow flex-col px-5 pt-5 pb-5'>
          <h3 className='text-[15px] font-bold leading-snug tracking-tight line-clamp-2 mb-1'>
            {offer.title}
          </h3>
          {offer.duration?.days > 0 && (
            <p className='text-[12px] text-muted font-medium mb-3'>
              {offer.duration.days} días / {offer.duration.nights} noches
            </p>
          )}

          {keyIncludes.length > 0 && (
            <div className='flex flex-wrap gap-1.5 mb-auto pb-3.5'>
              {keyIncludes.map((item, i) => (
                <span
                  key={i}
                  className='inline-flex items-center gap-1 text-[10px] font-semibold text-foreground bg-surface-tertiary rounded-full pl-1.5 pr-2 py-1 leading-none'
                >
                  <LuTag size={9} className='text-brand-primary shrink-0' />
                  {item}
                </span>
              ))}
            </div>
          )}

          {offer.airline?.name && (
            <div className='flex items-center gap-2 mt-2 mb-3.5 pb-3.5 border-b border-border'>
              {offer.airline.iata ? (
                <img
                  src={getLogoUrl(offer.airline.iata, 200)}
                  alt=''
                  className='h-8 w-8 object-contain shrink-0'
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <LuPlaneTakeoff size={14} className='text-brand-primary shrink-0' />
              )}
              <span className='text-[13px] font-bold text-foreground truncate'>{offer.airline.name}</span>
            </div>
          )}

          <div className='mt-auto flex items-end justify-between gap-2'>
            <div>
              {hasPrice ? (
                <>
                  {hasDiscount && (
                    <p className='text-[11px] text-muted line-through leading-none mb-0.5'>
                      {formatPrice(originalPrice, currency)}
                    </p>
                  )}
                  <p className='text-[21px] font-extrabold leading-none tracking-tight text-foreground'>
                    {formatPrice(price, currency)}
                  </p>
                  <p className='text-[10px] text-muted font-semibold mt-1'>/{offer.pricing?.pricePer || 'persona'}</p>
                </>
              ) : (
                <p className='text-sm font-semibold text-brand-primary'>A consultar</p>
              )}
            </div>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground shadow-brand-primary/30 transition-shadow duration-300 group-hover:shadow-lg'>
              <LuArrowUpRight size={16} strokeWidth={2.5} className='transition-transform duration-300 group-hover:rotate-45' />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
