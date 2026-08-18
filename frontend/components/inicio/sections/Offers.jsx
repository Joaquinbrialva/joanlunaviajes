'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuArrowRight, LuClock3, LuMapPin, LuTicket } from 'react-icons/lu';

function getPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
}

function OfferCard({ offer }) {
  const price = getPrice(offer);
  const hasPrice = price > 0;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const discount = offer.pricing?.discountPercentage;
  const currency = offer.pricing?.currency || 'USD';
  const originalPrice = offer.pricing?.originalPrice;
  const hasDiscount = discount > 0 && originalPrice && originalPrice > price;

  return (
    <Link href={`/ofertas/${offer.slug}`} className='group block h-full shrink-0 w-[240px] sm:w-[260px] snap-start'>
      <article className='h-full bg-surface rounded-2xl overflow-hidden flex flex-col border border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 hover:border-accent/25'>

        {/* Image */}
        <div className='relative overflow-hidden shrink-0' style={{ height: '140px' }}>
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={offer.title}
              fill
              sizes='260px'
              className='object-cover transition-transform duration-700 group-hover:scale-[1.07]'
            />
          ) : (
            <div className='absolute inset-0 bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent' />

          {/* Location chip */}
          <div className='absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2 py-0.5'>
            <LuMapPin size={9} className='text-white/80 shrink-0' />
            <span className='text-white text-[10px] font-semibold truncate max-w-[120px]'>
              {offer.location?.city}, {offer.location?.country}
            </span>
          </div>

          {/* Badge */}
          {hasDiscount ? (
            <span className='absolute top-2 right-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/30'>
              -{discount}%
            </span>
          ) : offer.isFeatured ? (
            <span className='absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full'>
              Destacada
            </span>
          ) : null}
        </div>

        {/* Content */}
        <div className='p-3 flex flex-col grow'>
          <h3
            className='leading-snug line-clamp-2 font-bold group-hover:text-accent transition-colors duration-300'
            style={{ fontSize: '0.875rem' }}
          >
            {offer.title}
          </h3>

          {offer.duration?.days > 0 && (
            <span className='flex items-center gap-1 text-[11px] text-muted mt-1.5'>
              <LuClock3 size={10} />
              {offer.duration.days} días
            </span>
          )}

          {/* Price row */}
          <div className='flex items-end justify-between gap-2 mt-auto pt-2.5 border-t border-border'>
            <div>
              {hasPrice && hasDiscount && originalPrice && (
                <p className='text-[11px] text-muted line-through leading-none mb-0.5'>
                  {currency} {formatNumber(originalPrice)}
                </p>
              )}
              {hasPrice ? (
                <p className='text-base font-bold text-accent leading-none'>
                  {currency} {formatNumber(price)}
                </p>
              ) : (
                <p className='text-xs font-medium text-muted italic'>Consultar</p>
              )}
              {offer.pricing?.pricePer && hasPrice && (
                <p className='text-[10px] text-muted mt-0.5'>/{offer.pricing.pricePer}</p>
              )}
            </div>
            <span className='text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 shrink-0'>
              <LuArrowRight size={16} />
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='space-y-8'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-2xl bg-brand-primary/12 flex items-center justify-center shrink-0'>
            <LuTicket size={22} className='text-brand-primary' />
          </div>
          <div>
            <h2 className='font-extrabold text-foreground leading-tight tracking-tight' style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
              Ofertas imperdibles
            </h2>
            <p className='text-[13px] text-muted mt-2 max-w-xs leading-relaxed'>
              Los paquetes más solicitados, listos para reservar hoy.
            </p>
          </div>
        </div>

        <Link
          href='/ofertas'
          className='hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-primary transition-colors group shrink-0'
        >
          Ver todas
          <LuArrowRight size={14} className='group-hover:translate-x-0.5 transition-transform' />
        </Link>
      </div>

      {loading ? (
        <OffersSkeleton />
      ) : offers.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-center rounded-2xl border border-dashed border-border'>
          <p className='font-semibold text-foreground'>Proximamente nuevas ofertas</p>
          <p className='text-sm text-muted'>Estamos preparando paquetes exclusivos. Vuelve pronto.</p>
        </div>
      ) : (
        <div className='flex gap-4 overflow-x-auto py-4 -my-4 -mx-1 px-1 snap-x snap-mandatory'>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      <div className='sm:hidden text-center'>
        <Link href='/ofertas' className='inline-flex items-center gap-2 text-sm font-semibold text-accent'>
          Ver todas las ofertas <LuArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function OffersSkeleton() {
  return (
    <div className='flex gap-4 overflow-x-auto py-4 -my-4 -mx-1 px-1'>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className='shrink-0 w-[240px] sm:w-[260px] rounded-2xl bg-surface border border-border overflow-hidden flex flex-col animate-pulse'>
          <div className='bg-surface-secondary' style={{ height: '140px' }} />
          <div className='p-3 flex flex-col gap-2.5'>
            <div className='h-3.5 w-3/4 rounded-full bg-border' />
            <div className='h-3 w-1/2 rounded-full bg-border' />
            <div className='pt-2.5 border-t border-border flex items-end justify-between'>
              <div className='h-5 w-20 rounded-full bg-border' />
              <div className='h-4 w-4 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
