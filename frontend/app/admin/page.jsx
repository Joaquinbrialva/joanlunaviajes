'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LuClipboardList,
  LuGlobe,
  LuImage,
  LuMessageSquare,
  LuTrendingUp,
  LuCircleCheck,
  LuClock,
} from 'react-icons/lu';
import {
  normalizeInquiry,
  INQUIRY_STATUS_CLASS,
  INQUIRY_STATUS_LABEL,
} from '@/lib/inquiries';

/* ─── Helpers ────────────────────────────────────────────────────────── */

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatUSD(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function calcGrowth(items) {
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const current = items.filter((i) => now - new Date(i.createdAt).getTime() < month).length;
  const prev = items.filter((i) => {
    const age = now - new Date(i.createdAt).getTime();
    return age >= month && age < month * 2;
  }).length;
  if (prev === 0) return current > 0 ? '+100%' : null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function calcRevenueGrowth(offers) {
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const sum = (list) => list.reduce((acc, o) => acc + getOfferPrice(o), 0);
  const current = sum(offers.filter((o) => now - new Date(o.createdAt).getTime() < month));
  const prev = sum(offers.filter((o) => {
    const age = now - new Date(o.createdAt).getTime();
    return age >= month && age < month * 2;
  }));
  if (prev === 0) return current > 0 ? '+100%' : null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `hace ${days} días`;
}

/* ─── Página principal ───────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});

    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOffers(data); })
      .catch(() => {});
  }, []);

  // Admin y agente también cargan destinos e inquiries
  useEffect(() => {
    if (!user || user.role === 'designer') return;
    Promise.all([
      fetch('/api/destinos').then((r) => r.json()),
      fetch('/api/cotizaciones').then((r) => r.json()),
    ])
      .then(([d, i]) => {
        if (Array.isArray(d)) setDestinations(d);
        if (Array.isArray(i)) setInquiries(i.map(normalizeInquiry));
      })
      .catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent' />
      </div>
    );
  }

  if (user.role === 'designer') {
    return <DesignerDashboard user={user} offers={offers} />;
  }

  return <AdminAgentDashboard user={user} offers={offers} destinations={destinations} inquiries={inquiries} />;
}

/* ─── Dashboard: Admin / Agente ──────────────────────────────────────── */

function AdminAgentDashboard({ offers, destinations, inquiries }) {
  const monthlyRevenue = offers.slice(0, 8).reduce((sum, o) => sum + getOfferPrice(o), 0);
  const latestInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const pendingMedia = offers.filter((o) => o.mediaReady === false).length;

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Resumen del panel</h2>
          <p className='text-muted'>Resumen operativo de ofertas, destinos y solicitudes.</p>
        </div>
        <Link
          href='/admin/ofertas/nueva'
          className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-semibold'
        >
          + Crear nueva oferta
        </Link>
      </section>

      {/* Alerta de ofertas sin imagen */}
      {pendingMedia > 0 && (
        <div className='flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-300'>
          <LuImage className='h-4 w-4 shrink-0' />
          <span>
            <strong>{pendingMedia}</strong> oferta{pendingMedia > 1 ? 's' : ''} pendiente{pendingMedia > 1 ? 's' : ''} de imagen — el diseñador fue notificado.{' '}
            <Link href='/admin/ofertas' className='font-semibold underline underline-offset-2'>
              Ver ofertas
            </Link>
          </span>
        </div>
      )}

      <section className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
        <StatCard title='Ofertas activas' value={offers.length} icon={<LuClipboardList />} growth={calcGrowth(offers)} />
        <StatCard title='Destinos' value={destinations.length} icon={<LuGlobe />} growth={calcGrowth(destinations)} />
        <StatCard title='Cotizaciones' value={inquiries.length} icon={<LuMessageSquare />} growth={calcGrowth(inquiries)} />
        <StatCard title='Ingresos estimados' value={formatUSD(monthlyRevenue)} icon={<LuTrendingUp />} growth={calcRevenueGrowth(offers)} />
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
        {latestInquiries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-12 text-center'>
            <LuMessageSquare className='h-10 w-10 text-muted/40' />
            <p className='font-semibold text-foreground'>Sin cotizaciones todavía</p>
            <p className='text-sm text-muted'>Cuando lleguen solicitudes de clientes, aparecerán aquí.</p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}

/* ─── Dashboard: Diseñador ───────────────────────────────────────────── */

function DesignerDashboard({ user, offers }) {
  const router = useRouter();
  const pending = offers.filter((o) => o.mediaReady === false);
  const completed = offers
    .filter((o) => o.mediaReady === true)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  return (
    <div className='space-y-6'>
      <section>
        <h2 className='text-4xl font-bold'>
          Hola, {user?.name?.split(' ')[0] ?? 'Diseñador'} 👋
        </h2>
        <p className='text-muted mt-1'>Acá podés ver las ofertas que necesitan imagen de portada.</p>
      </section>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-4'>
        <article className='rounded-2xl border border-default bg-surface p-4 space-y-2'>
          <div className='flex items-center gap-2 text-sky-600'>
            <LuClock className='h-5 w-5' />
            <span className='text-sm font-semibold'>Pendientes</span>
          </div>
          <p className='text-4xl font-bold'>{pending.length}</p>
          <p className='text-xs text-muted'>Ofertas sin imagen de portada</p>
        </article>
        <article className='rounded-2xl border border-default bg-surface p-4 space-y-2'>
          <div className='flex items-center gap-2 text-emerald-600'>
            <LuCircleCheck className='h-5 w-5' />
            <span className='text-sm font-semibold'>Con imagen</span>
          </div>
          <p className='text-4xl font-bold'>{offers.filter((o) => o.mediaReady === true).length}</p>
          <p className='text-xs text-muted'>Ofertas con imagen subida</p>
        </article>
      </div>

      {/* Pendientes */}
      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='flex items-center justify-between border-b border-default px-5 py-4'>
          <div>
            <h3 className='text-xl font-bold flex items-center gap-2'>
              <LuClock className='h-4 w-4 text-sky-500' />
              Pendientes de imagen
            </h3>
            <p className='text-sm text-muted mt-0.5'>
              {pending.length === 0
                ? '¡Todo al día! No hay ofertas pendientes.'
                : `${pending.length} oferta${pending.length > 1 ? 's' : ''} esperando su portada.`}
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-12 text-center'>
            <LuCircleCheck className='h-10 w-10 text-emerald-400' />
            <p className='font-semibold text-foreground'>No hay nada pendiente</p>
            <p className='text-sm text-muted'>Cuando se creen nuevas ofertas sin imagen, aparecerán aquí.</p>
          </div>
        ) : (
          <ul className='divide-y divide-default'>
            {pending.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-4'>
                {/* Placeholder de imagen */}
                <div className='flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted border border-dashed border-default'>
                  <LuImage className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold'>{offer.title}</p>
                  <p className='text-sm text-muted'>
                    {offer.location?.city ? `${offer.location.city}, ` : ''}{offer.location?.country}
                  </p>
                  <p className='text-xs text-muted/70 mt-0.5'>Creada {timeAgo(offer.createdAt)}</p>
                </div>
                <button
                  type='button'
                  onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)}
                  className='shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90'
                >
                  <LuImage className='h-3.5 w-3.5' />
                  Subir imagen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recientemente completadas */}
      {completed.length > 0 && (
        <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
          <div className='border-b border-default px-5 py-4'>
            <h3 className='text-xl font-bold flex items-center gap-2'>
              <LuCircleCheck className='h-4 w-4 text-emerald-500' />
              Recientemente completadas
            </h3>
          </div>
          <ul className='divide-y divide-default'>
            {completed.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-3'>
                {offer.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offer.images[0].url}
                    alt={offer.title}
                    className='h-12 w-16 shrink-0 rounded-lg object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-secondary'>
                    <LuImage className='h-4 w-4 text-muted' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold'>{offer.title}</p>
                  <p className='text-xs text-muted'>{timeAgo(offer.updatedAt)}</p>
                </div>
                <span className='shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
                  <LuCircleCheck className='h-3 w-3' /> Listo
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ─── Componentes compartidos ────────────────────────────────────────── */

function StatCard({ title, value, icon, growth }) {
  const isNegative = typeof growth === 'string' && growth.startsWith('-');
  return (
    <article className='rounded-2xl border border-default bg-surface p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='h-9 w-9 rounded-lg bg-surface-secondary grid place-content-center text-accent'>
          {icon}
        </span>
        {growth != null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isNegative
              ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/30'
              : 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
          }`}>
            {growth}
          </span>
        )}
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
