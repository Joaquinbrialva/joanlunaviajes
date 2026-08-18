'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowRight, LuTicket } from 'react-icons/lu';
import OfferSlider from '@/components/inicio/ui/OfferSlider';
import OfferCard from '@/components/offer-card';

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
        <OfferSlider>
          {offers.map((offer) => (
            <div key={offer.id} data-offer-card className='w-[280px] shrink-0 snap-start sm:w-[320px]'>
              <OfferCard offer={offer} />
            </div>
          ))}
        </OfferSlider>
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
    <div className='flex gap-5 overflow-hidden animate-pulse'>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className='w-[280px] sm:w-[320px] shrink-0 overflow-hidden rounded-2xl border border-border bg-surface flex flex-col'>
          <div className='h-52 bg-surface-secondary' />
          <div className='flex items-center gap-3 px-4 py-2 bg-surface-secondary border-b border-border'>
            <div className='h-3 w-10 rounded-full bg-border' />
            <div className='h-3 w-14 rounded-full bg-border' />
          </div>
          <div className='p-4 flex flex-col gap-3 grow'>
            <div className='h-4 w-3/4 rounded-full bg-border' />
            <div className='h-3.5 w-1/2 rounded-full bg-border' />
            <div className='mt-auto pt-3 border-t border-border flex items-end justify-between'>
              <div className='h-6 w-24 rounded-full bg-border' />
              <div className='h-9 w-24 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
