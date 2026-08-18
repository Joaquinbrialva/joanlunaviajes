'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton, Button } from '@heroui/react';
import {
  LuClipboardList,
  LuGlobe,
  LuImage,
  LuMessageSquare,
  LuClock,
  LuArrowRight,
  LuPlus,
} from 'react-icons/lu';
import { normalizeInquiry } from '@/lib/inquiries';
import { PageHeader, Section, EmptyState, LinkButton, InquiryStatusChip } from '@/components/admin/kit';

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

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `hace ${days} días`;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [offers, setOffers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [inquiries, setInquiries] = useState([]);

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

function AdminAgentDashboard({ user, offers, destinations, inquiries, loading }) {
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length;
  const latestInquiries = [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className='space-y-7'>
      <PageHeader
        title={`Hola, ${user?.name?.split(' ')[0]}`}
        description='Este es el resumen de tu panel.'
        actions={
          <LinkButton href='/admin/ofertas/nueva' size='lg'>
            <LuPlus className='h-4 w-4' />
            Nueva oferta
          </LinkButton>
        }
      />

      <section className='grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]'>
        {loading ? (
          <>
            <Skeleton className='h-[180px] rounded-2xl' />
            <Skeleton className='h-[180px] rounded-2xl' />
          </>
        ) : (
          <>
            <StatCard title='Cotizaciones pendientes' value={pendingInquiries} icon={<LuClock className='h-5 w-5' />} growth={calcGrowth(inquiries.filter((i) => i.status === 'pending'))} accent='emerald' tall />
            <div className='divide-y divide-default overflow-hidden rounded-2xl border border-default bg-surface'>
              <StatRow title='Ofertas activas' value={offers.length} icon={<LuClipboardList className='h-4 w-4' />} growth={calcGrowth(offers)} accent='orange' />
              <StatRow title='Destinos' value={destinations.length} icon={<LuGlobe className='h-4 w-4' />} growth={calcGrowth(destinations)} accent='sky' />
              <StatRow title='Cotizaciones' value={inquiries.length} icon={<LuMessageSquare className='h-4 w-4' />} growth={calcGrowth(inquiries)} accent='violet' />
            </div>
          </>
        )}
      </section>

      <Section
        title='Últimas cotizaciones'
        description='Solicitudes recientes pendientes de gestión.'
        actions={
          <a href='/admin/cotizaciones' className='inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline'>
            Ver todas <LuArrowRight className='h-3.5 w-3.5' />
          </a>
        }
      >
        {loading ? (
          <div className='space-y-2 p-5'>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-12 rounded-xl' />)}
          </div>
        ) : latestInquiries.length === 0 ? (
          <EmptyState icon={LuMessageSquare} title='Sin cotizaciones todavía' description='Cuando lleguen solicitudes de clientes aparecerán aquí.' />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-surface-secondary/60'>
                  <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted'>Cliente</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted'>Solicitud</th>
                  <th className='hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:table-cell'>Viajeros</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted'>Estado</th>
                  <th className='hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted md:table-cell'>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {latestInquiries.map((item) => (
                  <tr key={item.id} className='border-t border-default transition-colors hover:bg-surface-secondary/40'>
                    <td className='px-5 py-3.5'>
                      <p className='text-[13px] font-semibold'>{item.name}</p>
                      <p className='text-xs text-muted'>{item.email}</p>
                    </td>
                    <td className='px-5 py-3.5'>
                      <p className='text-[13px]'>{item.requestTitle}</p>
                      <p className='text-xs text-muted'>{item.requestMeta}</p>
                    </td>
                    <td className='hidden px-5 py-3.5 sm:table-cell'><span className='text-[13px]'>{item.passengers ?? '—'}</span></td>
                    <td className='px-5 py-3.5'><InquiryStatusChip status={item.status} /></td>
                    <td className='hidden px-5 py-3.5 text-xs text-muted md:table-cell'>{timeAgo(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function DesignerDashboard({ user, offers, loading }) {
  const router = useRouter();
  const recent = [...offers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);

  return (
    <div className='space-y-7'>
      <PageHeader title={`Hola, ${user?.name?.split(' ')[0] ?? 'Diseñador'}`} description='Ofertas recientes para revisar su imagen.' />

      <Section title='Ofertas'>
        {loading ? (
          <div className='space-y-2 p-5'>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-16 rounded-xl' />)}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState icon={LuImage} title='Sin ofertas todavía' description='Cuando se creen nuevas ofertas aparecerán aquí.' />
        ) : (
          <ul className='divide-y divide-default'>
            {recent.map((offer) => (
              <li key={offer.id} className='flex items-center gap-4 px-5 py-4'>
                {offer.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.images[0].url} alt={offer.title} className='h-14 w-20 shrink-0 rounded-xl object-cover' />
                ) : (
                  <div className='flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-default bg-surface-secondary text-muted'>
                    <LuImage className='h-5 w-5' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-semibold'>{offer.title}</p>
                  <p className='mt-0.5 text-xs text-muted'>{offer.location?.city ? `${offer.location.city}, ` : ''}{offer.location?.country}</p>
                  <p className='mt-0.5 text-[11px] text-muted/60'>Actualizada {timeAgo(offer.updatedAt)}</p>
                </div>
                <Button size='sm' onClick={() => router.push(`/admin/ofertas/${offer.slug}/editar`)} className='shrink-0'>
                  <LuImage className='h-3.5 w-3.5' />
                  Editar imagen
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

const ACCENT_STYLES = {
  orange: 'bg-accent/10 text-accent',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function GrowthPill({ growth }) {
  if (growth == null) return null;
  const isNeg = growth.startsWith('-');
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${isNeg ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/25' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25'}`}>
      {growth}
    </span>
  );
}

function StatCard({ title, value, icon, growth, accent = 'orange', tall = false }) {
  return (
    <article className={`overflow-hidden rounded-2xl border border-default bg-surface ${tall ? 'flex flex-col justify-between' : ''}`}>
      <div className={tall ? 'flex flex-1 flex-col justify-between p-6' : 'p-5'}>
        <div className='mb-4 flex items-start justify-between'>
          <div className={`${tall ? 'h-12 w-12' : 'h-10 w-10'} grid place-content-center rounded-xl ${ACCENT_STYLES[accent]}`}>{icon}</div>
          <GrowthPill growth={growth} />
        </div>
        <div>
          <p className={`${tall ? 'text-[2.75rem]' : 'text-[2rem]'} font-bold leading-none tracking-tight text-foreground`}>{value}</p>
          <p className='mt-1.5 text-xs font-medium text-muted'>{title}</p>
        </div>
      </div>
    </article>
  );
}

function StatRow({ title, value, icon, growth, accent = 'orange' }) {
  return (
    <div className='flex items-center gap-3 px-5 py-4'>
      <div className={`h-9 w-9 shrink-0 grid place-content-center rounded-xl ${ACCENT_STYLES[accent]}`}>{icon}</div>
      <div className='min-w-0 flex-1'>
        <p className='text-xl font-bold leading-none tracking-tight text-foreground'>{value}</p>
        <p className='mt-1 text-xs font-medium text-muted'>{title}</p>
      </div>
      <GrowthPill growth={growth} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className='space-y-7'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56 rounded-lg' />
          <Skeleton className='h-3.5 w-64 rounded' />
        </div>
        <Skeleton className='h-10 w-36 rounded-xl' />
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]'>
        <Skeleton className='h-[180px] rounded-2xl' />
        <Skeleton className='h-[180px] rounded-2xl' />
      </div>
      <Skeleton className='h-[320px] rounded-2xl' />
    </div>
  );
}
