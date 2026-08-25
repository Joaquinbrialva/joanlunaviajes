'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowRight, LuPlaneTakeoff } from 'react-icons/lu';
import RowSlider from '@/components/inicio/ui/RowSlider';
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
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-5'>
        <div className='max-w-xl'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-brand-primary mb-3'>
            <LuPlaneTakeoff size={12} strokeWidth={2.5} />
            Salidas con lugares confirmados
          </span>
          <h2 className='font-extrabold leading-[1.05] tracking-tight text-foreground' style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
            Precios que no vas a encontrar mañana
          </h2>
        </div>

        <Link
          href='/ofertas'
          className='hidden sm:inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-brand-primary transition-colors group shrink-0 whitespace-nowrap'
        >
          Ver todas las ofertas
          <span className='w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/10 transition-colors'>
            <LuArrowRight size={14} className='group-hover:translate-x-0.5 transition-transform' />
          </span>
        </Link>
      </div>

      {loading ? (
        <OffersSkeleton />
      ) : offers.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-center rounded-[28px] border border-dashed border-border'>
          <p className='font-semibold text-foreground'>Próximamente nuevas ofertas</p>
          <p className='text-sm text-muted'>Estamos preparando paquetes exclusivos. Vuelve pronto.</p>
        </div>
      ) : (
        <RowSlider rows={1}>
          {offers.map((offer) => (
            <div key={offer.id} data-row-card className='w-[290px] sm:w-[320px]'>
              <OfferCard offer={offer} />
            </div>
          ))}
        </RowSlider>
      )}

      <div className='sm:hidden text-center'>
        <Link href='/ofertas' className='inline-flex items-center gap-2 text-sm font-semibold text-brand-primary'>
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
        <div key={idx} className='w-[290px] sm:w-[320px] overflow-hidden rounded-[22px] border border-border bg-surface flex flex-col'>
          <div className='h-52 bg-surface-secondary' />
          <div className='p-5 flex flex-col gap-3 grow'>
            <div className='h-4 w-3/4 rounded-full bg-border' />
            <div className='h-3.5 w-1/2 rounded-full bg-border' />
            <div className='mt-auto pt-3 flex items-end justify-between'>
              <div className='h-6 w-24 rounded-full bg-border' />
              <div className='h-10 w-10 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
