'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuArrowRight, LuClock3, LuMapPin, LuStar, LuPlane } from 'react-icons/lu';
import { getLogoUrl } from '@/lib/airlines';

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
    <Link href={`/ofertas/${offer.slug}`} className='group block h-full'>
      <article className='h-full bg-surface rounded-2xl overflow-hidden flex flex-col border border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 hover:border-accent/25'>

        {/* Image */}
        <div className='relative overflow-hidden shrink-0' style={{ height: '200px' }}>
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={offer.title}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
              className='object-cover transition-transform duration-700 group-hover:scale-[1.07]'
            />
          ) : (
            <div className='absolute inset-0 bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent' />

          {/* Location chip */}
          <div className='absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1'>
            <LuMapPin size={9} className='text-white/80 shrink-0' />
            <span className='text-white text-[10px] font-semibold truncate max-w-[120px]'>
              {offer.location?.city}, {offer.location?.country}
            </span>
          </div>

          {/* Badge */}
          {hasDiscount ? (
            <span className='absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/30'>
              -{discount}%
            </span>
          ) : offer.isFeatured ? (
            <span className='absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full'>
              Destacada
            </span>
          ) : null}
        </div>

        {/* Stats strip */}
        <div className='flex items-center gap-3 px-4 py-2 bg-surface-secondary border-b border-border'>
          {offer.rating?.value > 0 && (
            <span className='flex items-center gap-1 text-[11px] font-bold text-foreground shrink-0'>
              <LuStar size={10} fill='currentColor' className='text-amber-400' />
              {offer.rating.value}
            </span>
          )}
          {offer.duration?.days > 0 && offer.availability?.startDate && offer.availability?.endDate && (
            <span className='flex items-center gap-1 text-[11px] text-muted shrink-0'>
              <LuClock3 size={10} />
              {offer.duration.days} días
            </span>
          )}
          {offer.airline?.name && (
            <span className='flex items-center gap-1.5 text-[11px] text-muted truncate'>
              {offer.airline.iata ? (
                <img
                  src={getLogoUrl(offer.airline.iata)}
                  alt=''
                  className='h-4 w-6 object-contain shrink-0'
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <LuPlane size={10} className='shrink-0' />
              )}
              {offer.airline.name}
            </span>
          )}
        </div>

        {/* Content */}
        <div className='p-4 flex flex-col grow'>
          <h3
            className='leading-snug line-clamp-2 font-bold group-hover:text-accent transition-colors duration-300 mb-auto'
            style={{ fontSize: '1rem' }}
          >
            {offer.title}
          </h3>

          {/* Price row */}
          <div className='flex items-end justify-between gap-2 mt-4 pt-3 border-t border-border'>
            <div>
              {hasPrice && hasDiscount && originalPrice && (
                <p className='text-xs text-muted line-through leading-none mb-0.5'>
                  {currency} {formatNumber(originalPrice)}
                </p>
              )}
              {hasPrice ? (
                <p className='text-xl font-bold text-accent leading-none'>
                  {currency} {formatNumber(price)}
                </p>
              ) : (
                <p className='text-sm font-medium text-muted italic'>Consultar precio</p>
              )}
              {offer.pricing?.pricePer && hasPrice && (
                <p className='text-[11px] text-muted mt-0.5'>/{offer.pricing.pricePer}</p>
              )}
            </div>
            <span className='text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 shrink-0'>
              <LuArrowRight size={18} />
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
        if (Array.isArray(data)) setOffers(data.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='space-y-8'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3 mb-3'>
            <div className='h-px w-8 bg-accent' />
            <p className='text-[9px] uppercase tracking-[0.3em] font-bold text-accent'>
              Paquetes exclusivos
            </p>
          </div>
          <h2
            className='font-light text-foreground leading-none'
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2.4rem, 5vw, 3.5rem)' }}
          >
            Ofertas <em className='font-semibold'>Imperdibles</em>
          </h2>
          <p className='text-[13px] text-muted mt-3 max-w-xs leading-relaxed'>
            Los paquetes mas solicitados, disenados para cada tipo de viajero.
          </p>
        </div>

        <Link
          href='/ofertas'
          className='hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition-colors group shrink-0'
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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
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
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse'>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className='rounded-2xl bg-surface border border-border overflow-hidden flex flex-col'>
          <div className='bg-surface-secondary' style={{ height: '200px' }} />
          <div className='px-4 py-2 bg-surface-secondary border-b border-border flex items-center gap-3'>
            <div className='h-3 w-10 rounded-full bg-border' />
            <div className='h-3 w-14 rounded-full bg-border' />
          </div>
          <div className='p-4 flex flex-col gap-3 grow'>
            <div className='h-4 w-3/4 rounded-full bg-border' />
            <div className='h-3.5 w-1/2 rounded-full bg-border' />
            <div className='mt-auto pt-3 border-t border-border flex items-end justify-between'>
              <div className='h-6 w-24 rounded-full bg-border' />
              <div className='h-5 w-5 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
