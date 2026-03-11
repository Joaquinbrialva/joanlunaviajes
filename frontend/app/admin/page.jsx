'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuClipboardList, LuGlobe, LuMessageSquare, LuTrendingUp } from 'react-icons/lu';
import {
  normalizeInquiry,
  INQUIRY_STATUS_CLASS,
  INQUIRY_STATUS_LABEL,
} from '@/lib/inquiries';

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatUSD(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function AdminDashboardPage() {
  const [offers, setOffers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/ofertas').then((r) => r.json()),
      fetch('/api/destinos').then((r) => r.json()),
      fetch('/api/cotizaciones').then((r) => r.json()),
    ]).then(([o, d, i]) => {
      if (Array.isArray(o)) setOffers(o);
      if (Array.isArray(d)) setDestinations(d);
      if (Array.isArray(i)) setInquiries(i.map(normalizeInquiry));
    }).catch(() => {});
  }, []);

  const monthlyRevenue = offers.slice(0, 8).reduce((sum, o) => sum + getOfferPrice(o), 0);
  const latestInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Resumen del panel</h2>
          <p className='text-muted'>Resumen operativo de ofertas, destinos y solicitudes.</p>
        </div>
        <Link href='/admin/ofertas/nueva' className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-semibold'>
          + Crear nueva oferta
        </Link>
      </section>

      <section className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
        <StatCard title='Ofertas activas' value={offers.length} icon={<LuClipboardList />} growth='+5.2%' />
        <StatCard title='Destinos' value={destinations.length} icon={<LuGlobe />} growth='+3.1%' />
        <StatCard title='Cotizaciones' value={inquiries.length} icon={<LuMessageSquare />} growth='+12.5%' />
        <StatCard title='Ingresos estimados' value={formatUSD(monthlyRevenue)} icon={<LuTrendingUp />} growth='+8.4%' />
      </section>

      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='p-4 md:p-5 border-b border-default flex items-center justify-between'>
          <div>
            <h3 className='text-2xl font-bold'>Últimas cotizaciones</h3>
            <p className='text-sm text-muted'>Solicitudes recientes pendientes de gestión.</p>
          </div>
          <Link href='/admin/cotizaciones' className='text-sm font-semibold text-accent hover:underline'>
            Ver todas
          </Link>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-surface-secondary text-muted'>
              <tr>
                <th className='text-left px-4 py-3 font-semibold'>Cliente</th>
                <th className='text-left px-4 py-3 font-semibold'>Solicitud</th>
                <th className='text-left px-4 py-3 font-semibold'>Viajeros</th>
                <th className='text-left px-4 py-3 font-semibold'>Estado</th>
              </tr>
            </thead>
            <tbody>
              {latestInquiries.map((item) => (
                <tr key={item.id} className='border-t border-default'>
                  <td className='px-4 py-3'>
                    <p className='font-semibold'>{item.name}</p>
                    <p className='text-muted text-xs'>{item.email}</p>
                  </td>
                  <td className='px-4 py-3'>
                    <p>{item.requestTitle}</p>
                    <p className='text-muted text-xs'>{item.requestMeta}</p>
                  </td>
                  <td className='px-4 py-3'>{item.passengers ?? '—'}</td>
                  <td className='px-4 py-3'>
                    <StatusPill status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, growth }) {
  return (
    <article className='rounded-2xl border border-default bg-surface p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='h-9 w-9 rounded-lg bg-surface-secondary grid place-content-center text-accent'>
          {icon}
        </span>
        <span className='text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full'>
          {growth}
        </span>
      </div>
      <p className='text-sm text-muted'>{title}</p>
      <p className='text-4xl font-bold'>{value}</p>
    </article>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${INQUIRY_STATUS_CLASS[status] || INQUIRY_STATUS_CLASS.pending}`}>
      {INQUIRY_STATUS_LABEL[status] || status}
    </span>
  );
}
