'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import HeroSelect from '@/components/ui/hero-select';

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatPrice(amount, currency) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function getStatus(offer) {
  if (!offer.availability?.remainingSpots || offer.availability.remainingSpots <= 2) return 'low_stock';
  if (offer.isFeatured) return 'featured';
  return 'active';
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data)) setOffers(data);
      })
      .catch(() => {
        if (active) setOffers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return offers.filter((offer) => {
      const offerStatus = getStatus(offer);
      const searchMatch =
        query.length === 0 ||
        offer.title.toLowerCase().includes(query) ||
        offer.location.city.toLowerCase().includes(query) ||
        offer.location.country.toLowerCase().includes(query);

      const statusMatch = status === 'all' || status === offerStatus;
      return searchMatch && statusMatch;
    });
  }, [search, status]);

  return (
    <div className='space-y-5'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Gestion de ofertas</h2>
          <p className='text-muted'>Administra disponibilidad, precios y estado comercial.</p>
        </div>
        <Link href='/admin/ofertas/nueva' className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-semibold'>
          + Nueva oferta
        </Link>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary'
            placeholder='Buscar por titulo o destino...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <HeroSelect
            value={status}
            onValueChange={(value) => setStatus(value)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activas' },
              { value: 'featured', label: 'Destacadas' },
              { value: 'low_stock', label: 'Pocos cupos' },
            ]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-surface-secondary text-muted'>
              <tr>
                <th className='text-left px-3 py-3 font-semibold'>Oferta</th>
                <th className='text-left px-3 py-3 font-semibold'>Destino</th>
                <th className='text-left px-3 py-3 font-semibold'>Duracion</th>
                <th className='text-left px-3 py-3 font-semibold'>Precio</th>
                <th className='text-left px-3 py-3 font-semibold'>Estado</th>
                <th className='text-right px-3 py-3 font-semibold'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((offer) => {
                const price = getOfferPrice(offer);
                const offerStatus = getStatus(offer);

                return (
                  <tr key={offer.id} className='border-t border-default'>
                    <td className='px-3 py-3'>
                      <p className='font-semibold'>{offer.title}</p>
                      <p className='text-xs text-muted'>ID {offer.id}</p>
                    </td>
                    <td className='px-3 py-3'>{offer.location.city}, {offer.location.country}</td>
                    <td className='px-3 py-3'>{offer.duration.days} dias / {offer.duration.nights} noches</td>
                    <td className='px-3 py-3'>{formatPrice(price, offer.pricing.currency)}</td>
                    <td className='px-3 py-3'>
                      <StatusPill status={offerStatus} />
                    </td>
                    <td className='px-3 py-3'>
                      <div className='flex justify-end gap-2'>
                        <Link href={`/ofertas/${offer.slug}`} className='text-xs font-semibold px-2 py-1 rounded border border-default hover:bg-surface-secondary'>
                          Ver
                        </Link>
                        <button className='text-xs font-semibold px-2 py-1 rounded border border-default hover:bg-surface-secondary'>
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    featured: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    low_stock: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  };

  const label = {
    active: 'Activa',
    featured: 'Destacada',
    low_stock: 'Pocos cupos',
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}
