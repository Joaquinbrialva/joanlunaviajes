'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton, Button } from '@heroui/react';
import {
  LuMessageSquare,
  LuArrowRight,
  LuArrowUpRight,
  LuArrowDownRight,
  LuPlus,
  LuImage,
} from 'react-icons/lu';
import { normalizeInquiry } from '@/lib/inquiries';
import { PageHeader, Section, EmptyState, LinkButton, InquiryStatusChip } from '@/components/admin/kit';

function monthDelta(items) {
  const now = Date.now();
  const month = 30 * 24 * 60 * 60 * 1000;
  const current = items.filter((i) => now - new Date(i.createdAt).getTime() < month).length;
  const prev = items.filter((i) => {
    const age = now - new Date(i.createdAt).getTime();
    return age >= month && age < month * 2;
  }).length;
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((current - prev) / prev) * 100);
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `hace ${days} días`;
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Buen día';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
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
  const pending = inquiries.filter((i) => i.status === 'pending');
  const latestInquiries = [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  const metrics = [
    { label: 'Cotizaciones pendientes', value: pending.length, delta: monthDelta(pending), href: '/admin/cotizaciones', emphasize: pending.length > 0 },
    { label: 'Ofertas publicadas', value: offers.length, delta: monthDelta(offers), href: '/admin/ofertas' },
    { label: 'Destinos activos', value: destinations.length, delta: monthDelta(destinations), href: '/admin/destinos' },
    { label: 'Cotizaciones totales', value: inquiries.length, delta: monthDelta(inquiries), href: '/admin/cotizaciones' },
  ];

  return (
    <div className='space-y-6'>
      <PageHeader
        title={`${greetingForNow()}, ${user?.name?.split(' ')[0]}`}
        description='Así está tu operación hoy.'
        actions={
          <LinkButton href='/admin/ofertas/nueva' size='lg'>
            <LuPlus className='h-4 w-4' />
            Nueva oferta
          </LinkButton>
        }
      />

      {loading ? (
        <Skeleton className='h-24 rounded-2xl' />
      ) : (
        <div className='grid grid-cols-2 divide-x divide-y divide-default overflow-hidden rounded-2xl border border-default bg-surface sm:grid-cols-4 sm:divide-y-0'>
          {metrics.map((m) => (
            <MetricCell key={m.label} {...m} />
          ))}
        </div>
      )}

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
          <ul className='divide-y divide-default'>
            {latestInquiries.map((item) => (
              <li key={item.id} className='flex items-center gap-4 px-5 py-3.5'>
                <div className='min-w-0 flex-[1.2]'>
                  <p className='truncate text-[13px] font-semibold text-foreground'>{item.name}</p>
                  <p className='truncate text-xs text-muted'>{item.email}</p>
                </div>
                <div className='hidden min-w-0 flex-[1.4] sm:block'>
                  <p className='truncate text-[13px] text-foreground'>{item.requestTitle}</p>
                  <p className='truncate text-xs text-muted'>{item.requestMeta}</p>
                </div>
                <span className='hidden w-16 shrink-0 text-xs text-muted md:block'>{timeAgo(item.createdAt)}</span>
                <div className='shrink-0'><InquiryStatusChip status={item.status} /></div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function DesignerDashboard({ user, offers, loading }) {
  const router = useRouter();
  const recent = [...offers].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);

  return (
    <div className='space-y-6'>
      <PageHeader title={`${greetingForNow()}, ${user?.name?.split(' ')[0] ?? 'Diseñador'}`} description='Ofertas recientes para revisar su imagen.' />

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

function MetricCell({ label, value, delta, href, emphasize }) {
  const hasDelta = delta !== null && delta !== undefined;
  const isNeg = hasDelta && delta < 0;
  return (
    <a
      href={href}
      className='group flex min-w-0 flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-secondary/50'
    >
      <span className='text-xs font-medium text-muted'>{label}</span>
      <div className='flex items-baseline gap-2'>
        <span className={`text-[1.75rem] font-bold leading-none tracking-tight tabular-nums ${emphasize ? 'text-accent' : 'text-foreground'}`}>
          {value}
        </span>
        {hasDelta && delta !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${isNeg ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {isNeg ? <LuArrowDownRight className='h-3 w-3' /> : <LuArrowUpRight className='h-3 w-3' />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </a>
  );
}

function PageSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56 rounded-lg' />
          <Skeleton className='h-3.5 w-64 rounded' />
        </div>
        <Skeleton className='h-10 w-36 rounded-xl' />
      </div>
      <Skeleton className='h-24 rounded-2xl' />
      <Skeleton className='h-[320px] rounded-2xl' />
    </div>
  );
}
