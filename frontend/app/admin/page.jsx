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
  LuArrowRight,
  LuPlus,
} from 'react-icons/lu';
import {
  normalizeInquiry,
  INQUIRY_STATUS_CLASS,
  INQUIRY_STATUS_LABEL,
} from '@/lib/inquiries';

/* ─── Helpers ─────────────────────────────────────────────────── */

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
  const now   = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const current = items.filter((i) => now - new Date(i.createdAt).getTime() < month).length;
  const prev    = items.filter((i) => {
    const age = now - new Date(i.createdAt).getTime();
    return age >= month && age < month * 2;
  }).length;
  if (prev === 0) return current > 0 ? '+100%' : null;
  const pct = Math.round(((current - prev) / prev) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function calcRevenueGrowth(offers) {
  const now   = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const sum   = (list) => list.reduce((acc, o) => acc + getOfferPrice(o), 0);
  const current = sum(offers.filter((o) => now - new Date(o.createdAt).getTime() < month));
  const prev    = sum(offers.filter((o) => {
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

/* ─── Page ──────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [user, setUser]                 = useState(null);
  const [loadingUser, setLoadingUser]   = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [offers, setOffers]             = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [inquiries, setInquiries]       = useState([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setOffers(d); })
      .catch(() => {})
      .finally(() => setLoadingOffers(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'designer') return;
    Promise.all([
      fetch('/api/destinos').then((r) => r.json()),
      fetch('/api/cotizaciones').then((r) => r.json()),
    ])
      .then(([d, i]) => {
        if (Array.isArray(d)) setDestinations(d);
        if (Array.isArray(i)) setInquiries(i.map(normalizeInquiry));
      })
      .catch(() => {})
      .finally(() => setLoadingExtras(false));
  }, [user]);

  const loadingData = loadingOffers || (user?.role !== 'designer' && loadingExtras);

  if (loadingUser || !user) {
    return (
      <div className='flex items-center justify-center py-28'>
        <div className='h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent' />
      </div>
    );
  }

  if (user.role === 'designer') return <DesignerDashboard user={user} offers={offers} loading={loadingData} />;
  return <AdminAgentDashboard user={user} offers={offers} destinations={destinations} inquiries={inquiries} loading={loadingData} />;
}

/* ─── Admin / Agent dashboard ───────────────────────────────────── */

function AdminAgentDashboard({ user, offers, destinations, inquiries, loading }) {
  const monthlyRevenue = offers.slice(0, 8).reduce((sum, o) => sum + getOfferPrice(o), 0);
  const latestInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const pendingMedia = offers.filter((o) => o.mediaReady === false).length;

  return (
    <div className='space-y-7'>

      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
            Bienvenido, {user?.name?.split(' ')[0]}
          </p>
          <h1 className='text-3xl font-bold tracking-tight'>Resumen del panel</h1>
        </div>
        <Link
          href='/admin/ofertas/nueva'
          className='inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20 shrink-0'
        >
          <LuPlus className='h-4 w-4' />
          Nueva oferta
        </Link>
      </section>

      {/* Alert */}
      {pendingMedia > 0 && (
        <div className='flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-900/10 px-5 py-3.5 text-sm text-sky-700 dark:text-sky-300'>
          <LuImage className='h-4 w-4 shrink-0' />
          <span>
            <strong>{pendingMedia}</strong> oferta{pendingMedia > 1 ? 's' : ''} pendiente{pendingMedia > 1 ? 's' : ''} de imagen —{' '}
            <Link href='/admin/ofertas' className='font-semibold underline underline-offset-2'>
              Ver ofertas
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <section className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
        <StatCard
          title='Ofertas activas'
          value={offers.length}
          icon={<LuClipboardList className='h-5 w-5' />}
          growth={calcGrowth(offers)}
          accent='orange'
        />
        <StatCard
          title='Destinos'
          value={destinations.length}
          icon={<LuGlobe className='h-5 w-5' />}
          growth={calcGrowth(destinations)}
          accent='sky'
        />
        <StatCard
          title='Cotizaciones'
          value={inquiries.length}
          icon={<LuMessageSquare className='h-5 w-5' />}
          growth={calcGrowth(inquiries)}
          accent='violet'
        />
        <StatCard
          title='Ingresos estimados'
          value={formatUSD(monthlyRevenue)}
          icon={<LuTrendingUp className='h-5 w-5' />}
          growth={calcRevenueGrowth(offers)}
          accent='emerald'
        />
      </section>

      {/* Latest inquiries */}
      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='px-5 py-4 border-b border-default flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-bold'>Últimas cotizaciones</h2>
            <p className='text-xs text-muted mt-0.5'>Solicitudes recientes pendientes de gestión.</p>
          </div>
          <Link
            href='/admin/cotizaciones'
            className='inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline'
          >
            Ver todas <LuArrowRight className='h-3.5 w-3.5' />
          </Link>
        </div>

        {loading ? (
          <div className='flex min-h-[320px] items-center justify-center'>
            <div className='h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent' />
          </div>
        ) : latestInquiries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-14 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-surface-secondary grid place-content-center'>
              <LuMessageSquare className='h-5 w-5 text-muted/50' />
            </div>
            <p className='text-sm font-semibold'>Sin cotizaciones todavía</p>
            <p className='text-xs text-muted'>Cuando lleguen solicitudes de clientes aparecerán aquí.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-surface-secondary/60'>
                  <th className='text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide'>Cliente</th>
                  <th className='text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide'>Solicitud</th>
                  <th className='text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell'>Viajeros</th>
                  <th className='text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide'>Estado</th>
                  <th className='text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell'>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {latestInquiries.map((item) => (
                  <tr key={item.id} className='border-t border-default hover:bg-surface-secondary/40 transition-colors'>
                    <td className='px-5 py-3.5'>
                      <p className='font-semibold text-[13px]'>{item.name}</p>
                      <p className='text-xs text-muted'>{item.email}</p>
                    </td>
                    <td className='px-5 py-3.5'>
                      <p className='text-[13px]'>{item.requestTitle}</p>
                      <p className='text-xs text-muted'>{item.requestMeta}</p>
                    </td>
                    <td className='px-5 py-3.5 hidden sm:table-cell'>
                      <span className='text-[13px]'>{item.passengers ?? '—'}</span>
                    </td>
                    <td className='px-5 py-3.5'>
                      <StatusPill status={item.status} />
                    </td>
                    <td className='px-5 py-3.5 hidden md:table-cell'>
                      <span className='text-xs text-muted'>{timeAgo(item.createdAt)}</span>
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

/* ─── Designer dashboard ─────────────────────────────────────── */

function DesignerDashboard({ user, offers, loading }) {
  const router    = useRouter();
  const pending   = offers.filter((o) => o.mediaReady === false);
  const completed = offers
    .filter((o) => o.mediaReady === true)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  return (
    <div className='space-y-7'>
      <section>
        <p className='text-xs uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
          Panel diseñador
        </p>
        <h1 className='text-3xl font-bold tracking-tight'>
          Hola, {user?.name?.split(' ')[0] ?? 'Diseñador'} 👋
        </h1>
      </section>

      <div className='grid grid-cols-2 gap-4'>
        <article className='rounded-2xl border border-default bg-surface p-5'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/30 grid place-content-center text-sky-600 dark:text-sky-400'>
              <LuClock className='h-4 w-4' />
            </div>
            <span className='text-sm font-semibold'>Pendientes</span>
          </div>
          <p className='text-4xl font-bold tracking-tight'>{pending.length}</p>
          <p className='text-xs text-muted mt-1'>Ofertas sin imagen de portada</p>
        </article>
        <article className='rounded-2xl border border-default bg-surface p-5'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 grid place-content-center text-emerald-600 dark:text-emerald-400'>
              <LuCircleCheck className='h-4 w-4' />
            </div>
            <span className='text-sm font-semibold'>Con imagen</span>
          </div>
          <p className='text-4xl font-bold tracking-tight'>
            {offers.filter((o) => o.mediaReady === true).length}
          </p>
          <p className='text-xs text-muted mt-1'>Ofertas con imagen subida</p>
        </article>
      </div>

      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='flex items-center justify-between border-b border-default px-5 py-4'>
          <div>
            <h2 className='text-lg font-bold flex items-center gap-2'>
              <LuClock className='h-4 w-4 text-sky-500' />
              Pendientes de imagen
            </h2>
            <p className='text-xs text-muted mt-0.5'>
              {pending.length === 0
                ? '¡Todo al día! No hay ofertas pendientes.'
                : `${pending.length} oferta${pending.length > 1 ? 's' : ''} esperando su portada.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className='flex min-h-[320px] items-center justify-center'>
            <div className='h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent' />
          </div>
        ) : pending.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-14 text-center'>
            <LuCircleCheck className='h-10 w-10 text-emerald-400' />
            <p className='text-sm font-semibold'>No hay nada pendiente</p>
            <p className='text-xs text-muted'>Cuando se creen nuevas ofertas sin imagen, aparecerán aquí.</p>
          </div>
        ) : (
          <ul className='divide-y divide-default'>
            {pending.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-4'>
                <div className='flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted border border-dashed border-default'>
                  <LuImage className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-[13px]'>{offer.title}</p>
                  <p className='text-xs text-muted mt-0.5'>
                    {offer.location?.city ? `${offer.location.city}, ` : ''}{offer.location?.country}
                  </p>
                  <p className='text-[11px] text-muted/60 mt-0.5'>Creada {timeAgo(offer.createdAt)}</p>
                </div>
                <button
                  type='button'
                  onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)}
                  className='shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-[12px] font-semibold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-500/20'
                >
                  <LuImage className='h-3.5 w-3.5' />
                  Subir imagen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {completed.length > 0 && (
        <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
          <div className='border-b border-default px-5 py-4'>
            <h2 className='text-lg font-bold flex items-center gap-2'>
              <LuCircleCheck className='h-4 w-4 text-emerald-500' />
              Recientemente completadas
            </h2>
          </div>
          <ul className='divide-y divide-default'>
            {completed.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-3.5'>
                {offer.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.images[0].url} alt={offer.title} className='h-12 w-16 shrink-0 rounded-xl object-cover' />
                ) : (
                  <div className='flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-secondary'>
                    <LuImage className='h-4 w-4 text-muted' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-semibold'>{offer.title}</p>
                  <p className='text-xs text-muted mt-0.5'>{timeAgo(offer.updatedAt)}</p>
                </div>
                <span className='shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400'>
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

/* ─── Shared components ─────────────────────────────────────── */

const ACCENT_STYLES = {
  orange:  { icon: 'bg-accent/10 text-accent',                       bar: 'from-accent/50' },
  sky:     { icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',        bar: 'from-sky-400/50' },
  violet:  { icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', bar: 'from-violet-400/50' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', bar: 'from-emerald-400/50' },
};

function StatCard({ title, value, icon, growth, accent = 'orange' }) {
  const isNeg  = typeof growth === 'string' && growth.startsWith('-');
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.orange;

  return (
    <article className='rounded-2xl border border-default bg-surface overflow-hidden'>
      {/* Accent top bar */}
      <div className={`h-px bg-gradient-to-r ${styles.bar} to-transparent`} />
      <div className='p-5'>
        <div className='flex items-start justify-between mb-4'>
          <div className={`w-10 h-10 rounded-xl grid place-content-center ${styles.icon}`}>
            {icon}
          </div>
          {growth != null && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                isNeg
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/25'
                  : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25'
              }`}
            >
              {growth}
            </span>
          )}
        </div>
        <p className='text-[2rem] font-bold tracking-tight leading-none text-foreground'>{value}</p>
        <p className='text-xs text-muted mt-1.5 font-medium'>{title}</p>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${INQUIRY_STATUS_CLASS[status] || INQUIRY_STATUS_CLASS.pending}`}>
      {INQUIRY_STATUS_LABEL[status] || status}
    </span>
  );
}
