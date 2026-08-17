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
  LuArrowRight,
  LuPlus,
} from 'react-icons/lu';
import {
  normalizeInquiry,
  INQUIRY_STATUS_CLASS,
  INQUIRY_STATUS_LABEL,
} from '@/lib/inquiries';
import { Button } from '@/components/ui/button';

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

  if (loadingUser || !user) return <PageSkeleton />;

  if (user.role === 'designer') return <DesignerDashboard user={user} offers={offers} loading={loadingData} />;
  return <AdminAgentDashboard user={user} offers={offers} destinations={destinations} inquiries={inquiries} loading={loadingData} />;
}

/* ─── Admin / Agent dashboard ───────────────────────────────────── */

function AdminAgentDashboard({ user, offers, destinations, inquiries, loading }) {
  const monthlyRevenue = offers.slice(0, 8).reduce((sum, o) => sum + getOfferPrice(o), 0);
  const latestInquiries = [...inquiries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className='space-y-7'>

      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Hola, {user?.name?.split(' ')[0]}</h1>
          <p className='text-sm text-muted mt-1'>Este es el resumen de tu panel.</p>
        </div>
        <Button asChild size='lg' className='shrink-0'>
          <Link href='/admin/ofertas/nueva'>
            <LuPlus className='h-4 w-4' />
            Nueva oferta
          </Link>
        </Button>
      </section>

      {/* Stat cards — revenue leads as the primary metric, the rest read as a compact list */}
      <section className='grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4'>
        {loading ? (
          <>
            <StatCardSkeleton tall />
            <div className='rounded-2xl border border-default bg-surface divide-y divide-default overflow-hidden'>
              {Array.from({ length: 3 }).map((_, i) => <StatRowSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <StatCard
              title='Ingresos estimados'
              value={formatUSD(monthlyRevenue)}
              icon={<LuTrendingUp className='h-5 w-5' />}
              growth={calcRevenueGrowth(offers)}
              accent='emerald'
              tall
            />
            <div className='rounded-2xl border border-default bg-surface divide-y divide-default overflow-hidden'>
              <StatRow
                title='Ofertas activas'
                value={offers.length}
                icon={<LuClipboardList className='h-4 w-4' />}
                growth={calcGrowth(offers)}
                accent='orange'
              />
              <StatRow
                title='Destinos'
                value={destinations.length}
                icon={<LuGlobe className='h-4 w-4' />}
                growth={calcGrowth(destinations)}
                accent='sky'
              />
              <StatRow
                title='Cotizaciones'
                value={inquiries.length}
                icon={<LuMessageSquare className='h-4 w-4' />}
                growth={calcGrowth(inquiries)}
                accent='violet'
              />
            </div>
          </>
        )}
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
          <InquiryTableSkeleton />
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
  const router = useRouter();
  const recent = [...offers]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8);

  return (
    <div className='space-y-7'>
      <section>
        <h1 className='text-3xl font-bold tracking-tight'>Hola, {user?.name?.split(' ')[0] ?? 'Diseñador'}</h1>
        <p className='text-sm text-muted mt-1'>Ofertas recientes para revisar su imagen.</p>
      </section>

      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='border-b border-default px-5 py-4'>
          <h2 className='text-lg font-bold flex items-center gap-2'>
            <LuImage className='h-4 w-4 text-accent' />
            Ofertas
          </h2>
        </div>

        {loading ? (
          <OfferListSkeleton />
        ) : recent.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-14 text-center'>
            <LuImage className='h-10 w-10 text-muted/40' />
            <p className='text-sm font-semibold'>Sin ofertas todavía</p>
            <p className='text-xs text-muted'>Cuando se creen nuevas ofertas aparecerán aquí.</p>
          </div>
        ) : (
          <ul className='divide-y divide-default'>
            {recent.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-4'>
                {offer.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.images[0].url} alt={offer.title} className='h-14 w-20 shrink-0 rounded-xl object-cover' />
                ) : (
                  <div className='flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted border border-dashed border-default'>
                    <LuImage className='h-5 w-5' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-semibold text-[13px]'>{offer.title}</p>
                  <p className='text-xs text-muted mt-0.5'>
                    {offer.location?.city ? `${offer.location.city}, ` : ''}{offer.location?.country}
                  </p>
                  <p className='text-[11px] text-muted/60 mt-0.5'>Actualizada {timeAgo(offer.updatedAt)}</p>
                </div>
                <Button
                  size='sm'
                  onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)}
                  className='shrink-0'
                >
                  <LuImage className='h-3.5 w-3.5' />
                  Editar imagen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
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

function StatCard({ title, value, icon, growth, accent = 'orange', tall = false }) {
  const isNeg  = typeof growth === 'string' && growth.startsWith('-');
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.orange;

  return (
    <article className={`rounded-2xl border border-default bg-surface overflow-hidden ${tall ? 'flex flex-col justify-between' : ''}`}>
      {/* Accent top bar */}
      <div className={`h-px bg-gradient-to-r ${styles.bar} to-transparent`} />
      <div className={tall ? 'p-6 flex-1 flex flex-col justify-between' : 'p-5'}>
        <div className='flex items-start justify-between mb-4'>
          <div className={`${tall ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl grid place-content-center ${styles.icon}`}>
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
        <div>
          <p className={`${tall ? 'text-[2.75rem]' : 'text-[2rem]'} font-bold tracking-tight leading-none text-foreground`}>{value}</p>
          <p className='text-xs text-muted mt-1.5 font-medium'>{title}</p>
        </div>
      </div>
    </article>
  );
}

function StatRow({ title, value, icon, growth, accent = 'orange' }) {
  const isNeg  = typeof growth === 'string' && growth.startsWith('-');
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.orange;

  return (
    <div className='flex items-center gap-3 px-5 py-4'>
      <div className={`w-9 h-9 rounded-xl grid place-content-center shrink-0 ${styles.icon}`}>
        {icon}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-xl font-bold tracking-tight leading-none text-foreground'>{value}</p>
        <p className='text-xs text-muted mt-1 font-medium'>{title}</p>
      </div>
      {growth != null && (
        <span
          className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isNeg
              ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/25'
              : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25'
          }`}
        >
          {growth}
        </span>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className='space-y-7 animate-pulse'>
      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <div className='h-8 w-56 rounded-lg bg-surface-secondary' />
          <div className='h-3.5 w-64 rounded bg-surface-secondary' />
        </div>
        <div className='h-10 w-36 rounded-xl bg-surface-secondary shrink-0' />
      </section>

      {/* Stat cards */}
      <section className='grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4'>
        <StatCardSkeleton tall />
        <div className='rounded-2xl border border-default bg-surface divide-y divide-default overflow-hidden'>
          {Array.from({ length: 3 }).map((_, i) => <StatRowSkeleton key={i} />)}
        </div>
      </section>

      {/* Table section */}
      <section className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='px-5 py-4 border-b border-default flex items-center justify-between'>
          <div className='space-y-2'>
            <div className='h-4 w-40 rounded bg-surface-secondary' />
            <div className='h-3 w-56 rounded bg-surface-secondary' />
          </div>
          <div className='h-4 w-16 rounded bg-surface-secondary' />
        </div>
        <InquiryTableSkeleton />
      </section>
    </div>
  );
}

function StatCardSkeleton({ tall = false }) {
  return (
    <article className='rounded-2xl border border-default bg-surface overflow-hidden'>
      <div className='h-px bg-surface-secondary' />
      <div className={`animate-pulse ${tall ? 'p-6' : 'p-5'}`}>
        <div className='flex items-start justify-between mb-4'>
          <div className={`${tall ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl bg-surface-secondary`} />
          <div className='w-12 h-5 rounded-full bg-surface-secondary' />
        </div>
        <div className={`${tall ? 'w-28 h-11' : 'w-20 h-8'} rounded-lg bg-surface-secondary mb-2`} />
        <div className='w-28 h-3 rounded bg-surface-secondary' />
      </div>
    </article>
  );
}

function StatRowSkeleton() {
  return (
    <div className='flex items-center gap-3 px-5 py-4 animate-pulse'>
      <div className='w-9 h-9 rounded-xl bg-surface-secondary shrink-0' />
      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='w-14 h-5 rounded bg-surface-secondary' />
        <div className='w-20 h-2.5 rounded bg-surface-secondary' />
      </div>
      <div className='w-10 h-5 rounded-full bg-surface-secondary shrink-0' />
    </div>
  );
}

function InquiryTableSkeleton() {
  return (
    <div className='overflow-x-auto animate-pulse'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='bg-surface-secondary/60'>
            <th className='px-5 py-3'><div className='h-3 w-14 rounded bg-surface-secondary' /></th>
            <th className='px-5 py-3'><div className='h-3 w-20 rounded bg-surface-secondary' /></th>
            <th className='px-5 py-3 hidden sm:table-cell'><div className='h-3 w-14 rounded bg-surface-secondary' /></th>
            <th className='px-5 py-3'><div className='h-3 w-12 rounded bg-surface-secondary' /></th>
            <th className='px-5 py-3 hidden md:table-cell'><div className='h-3 w-10 rounded bg-surface-secondary' /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className='border-t border-default'>
              <td className='px-5 py-3.5 space-y-1.5'>
                <div className='h-3 w-28 rounded bg-surface-secondary' />
                <div className='h-2.5 w-36 rounded bg-surface-secondary' />
              </td>
              <td className='px-5 py-3.5 space-y-1.5'>
                <div className='h-3 w-32 rounded bg-surface-secondary' />
                <div className='h-2.5 w-20 rounded bg-surface-secondary' />
              </td>
              <td className='px-5 py-3.5 hidden sm:table-cell'>
                <div className='h-3 w-6 rounded bg-surface-secondary' />
              </td>
              <td className='px-5 py-3.5'>
                <div className='h-5 w-20 rounded-full bg-surface-secondary' />
              </td>
              <td className='px-5 py-3.5 hidden md:table-cell'>
                <div className='h-2.5 w-16 rounded bg-surface-secondary' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OfferListSkeleton() {
  return (
    <ul className='divide-y divide-default animate-pulse'>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className='flex items-center gap-4 px-5 py-4'>
          <div className='h-14 w-20 shrink-0 rounded-xl bg-surface-secondary' />
          <div className='flex-1 space-y-2'>
            <div className='h-3 w-40 rounded bg-surface-secondary' />
            <div className='h-2.5 w-28 rounded bg-surface-secondary' />
            <div className='h-2.5 w-20 rounded bg-surface-secondary' />
          </div>
          <div className='h-9 w-28 shrink-0 rounded-xl bg-surface-secondary' />
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${INQUIRY_STATUS_CLASS[status] || INQUIRY_STATUS_CLASS.pending}`}>
      {INQUIRY_STATUS_LABEL[status] || status}
    </span>
  );
}
