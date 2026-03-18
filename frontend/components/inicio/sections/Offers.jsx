'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuArrowRight, LuClock3, LuMapPin, LuStar } from 'react-icons/lu';

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

  return (
    <Link
      href={`/ofertas/${offer.slug}`}
      className='group block'
    >
      <article
        className='relative overflow-hidden rounded-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/25'
        style={{ height: '250px' }}
      >
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={offer.title}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-cover transition-transform duration-700 group-hover:scale-[1.07]'
          />
        ) : (
          <div className='absolute inset-0 bg-slate-900' />
        )}

        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5' />
        <div
          className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'
          style={{ background: 'linear-gradient(to top, rgba(255,126,45,0.18) 0%, transparent 50%)' }}
        />

        {discount > 0 && (
          <span className='absolute top-3.5 left-3.5 bg-accent text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.15em] shadow-md'>
            -{discount}%
          </span>
        )}

        <div className='absolute inset-x-0 bottom-0 p-4'>
          <div className='flex items-center gap-1.5 mb-1.5'>
            <LuMapPin size={9} className='text-white/40 shrink-0' />
            <span className='text-white/40 text-[9px] uppercase tracking-[0.22em] font-bold'>
              {offer.location?.country || offer.location?.city || 'Oferta'}
            </span>
          </div>

          <h3 className='text-white font-bold text-lg leading-tight group-hover:text-orange-100 transition-colors duration-300 line-clamp-2'>
            {offer.title}
          </h3>

          {offer.subtitle && (
            <p className='text-white/50 text-[11px] leading-relaxed line-clamp-2 max-h-0 overflow-hidden opacity-0 group-hover:max-h-[3rem] group-hover:opacity-100 group-hover:mt-2 transition-all duration-400'>
              {offer.subtitle}
            </p>
          )}

          <div className='flex items-end justify-between gap-2 mt-2'>
            <div className='flex items-center gap-2.5 opacity-60 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300'>
              {offer.rating?.value > 0 && (
                <span className='flex items-center gap-1 text-amber-300 text-[11px] font-medium'>
                  <LuStar size={9} fill='currentColor' /> {offer.rating.value}
                </span>
              )}
              {offer.duration?.days > 0 && (
                <span className='flex items-center gap-1 text-white/35 text-[11px]'>
                  <LuClock3 size={9} /> {offer.duration.days}d
                </span>
              )}
            </div>

            {hasPrice ? (
              <div className='text-right'>
                <p className='text-white/40 text-[9px] uppercase tracking-[0.18em] font-medium leading-none mb-0.5'>Desde</p>
                <p className='text-white text-sm font-bold leading-none'>
                  {currency} {formatNumber(price)}
                </p>
              </div>
            ) : (
              <div className='text-right'>
                <div className='h-7' />
              </div>
            )}
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
        <div key={idx} className='relative overflow-hidden rounded-2xl bg-surface border border-border' style={{ height: '250px' }}>
          <div className='absolute inset-0 bg-surface-secondary' />
          <div className='absolute inset-x-0 bottom-0 p-4'>
            <div className='mb-2 h-3 w-20 rounded-full bg-white/20' />
            <div className='mb-3.5 h-6 w-3/4 rounded-2xl bg-white/20' />
            <div className='flex items-end justify-between gap-2'>
              <div className='h-4 w-24 rounded-full bg-white/20' />
              <div className='h-7 w-20 rounded-full bg-white/20' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
