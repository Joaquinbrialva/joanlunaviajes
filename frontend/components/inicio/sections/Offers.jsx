'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowRight, LuTicket } from 'react-icons/lu';
import OfferSlider from '@/components/inicio/ui/OfferSlider';
import OfferTicketCard from '@/components/inicio/ui/OfferTicketCard';

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
            <OfferTicketCard key={offer.id} offer={offer} />
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
        <div key={idx} className='flex h-[168px] w-[300px] sm:w-[340px] shrink-0 overflow-hidden rounded-[22px] border border-border bg-surface'>
          <div className='w-[36%] shrink-0 bg-surface-secondary' />
          <div className='w-px shrink-0 border-l-2 border-dashed border-border' />
          <div className='flex flex-1 flex-col justify-between gap-2.5 p-4 pl-5'>
            <div className='space-y-2'>
              <div className='h-4 w-4/5 rounded-full bg-border' />
              <div className='h-3 w-2/3 rounded-full bg-border' />
            </div>
            <div className='flex items-end justify-between gap-2 border-t border-dashed border-border pt-2.5'>
              <div className='h-6 w-20 rounded-full bg-border' />
              <div className='h-8 w-8 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
