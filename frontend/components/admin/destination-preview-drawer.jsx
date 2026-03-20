'use client';

import Link from 'next/link';
import AdminDrawer from './admin-drawer';

function Row({ label, children }) {
  return (
    <div className='flex gap-4 py-2.5 border-b border-default last:border-0'>
      <span className='text-xs text-muted w-36 shrink-0 pt-0.5'>{label}</span>
      <span className='text-sm flex-1 min-w-0'>{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className='px-5 py-4 border-b border-default'>
      <p className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>{title}</p>
      {children}
    </div>
  );
}

function TagList({ items, color = 'orange' }) {
  if (!items?.length) return <span className='text-muted text-sm'>—</span>;
  const cls = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }[color];
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {items.map((item, i) => (
        <li key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{item}</li>
      ))}
    </ul>
  );
}

function StatBar({ label, value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className='flex justify-between text-xs mb-1'>
        <span className='text-muted'>{label}</span>
        <span className='font-medium'>{value}</span>
      </div>
      <div className='h-1.5 rounded-full bg-surface-tertiary overflow-hidden'>
        <div className='h-full rounded-full bg-accent' style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DestinationPreviewDrawer({ destination, isOpen, onClose }) {
  if (!destination) return null;

  const ti = destination.travelInfo || {};
  const climate = destination.climate || {};
  const stats = destination.stats || {};
  const seo = destination.seo || {};

  return (
    <AdminDrawer isOpen={isOpen} onClose={onClose} title='Vista de destino — Admin'>

      {/* Cover */}
      {destination.featuredImage ? (
        <div className='relative h-40 bg-surface-secondary overflow-hidden'>
          <img src={destination.featuredImage} alt={destination.name} className='w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
          <div className='absolute bottom-3 left-5 right-5'>
            <p className='text-white font-bold text-lg leading-tight'>{destination.name}</p>
            <p className='text-white/70 text-xs mt-0.5'>{destination.country} · {destination.continent}</p>
          </div>
        </div>
      ) : (
        <div className='px-5 py-4 border-b border-default'>
          <p className='font-bold text-lg'>{destination.name}</p>
          <p className='text-sm text-muted'>{destination.country} · {destination.continent}</p>
        </div>
      )}

      {/* Badges */}
      <div className='flex gap-2 px-5 py-3 border-b border-default flex-wrap'>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${destination.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
          {destination.status === 'published' ? 'Publicado' : 'Borrador'}
        </span>
        {destination.isPopular && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>🔥 Popular</span>}
        {destination.isFeatured && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>⭐ Destacado</span>}
      </div>

      {/* Identificación */}
      <Section title='Identificación'>
        <Row label='ID'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.id}</code></Row>
        <Row label='Slug'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.slug}</code></Row>
        <Row label='Descripción corta'><span className='text-muted'>{destination.shortDescription || '—'}</span></Row>
        <Row label='Creado'>{destination.createdAt ? new Date(destination.createdAt).toLocaleDateString('es-AR') : '—'}</Row>
        <Row label='Actualizado'>{destination.updatedAt ? new Date(destination.updatedAt).toLocaleDateString('es-AR') : '—'}</Row>
      </Section>

      {/* Info de viaje */}
      <Section title='Información de viaje'>
        <Row label='Aeropuerto (IATA)'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{ti.airport || '—'}</code></Row>
        <Row label='Moneda'>{ti.currency || '—'}</Row>
        <Row label='Idioma'>{ti.language || '—'}</Row>
        <Row label='Zona horaria'><span className='text-xs text-muted'>{ti.timezone || '—'}</span></Row>
        <Row label='Visa requerida'>{ti.visaRequired ? <span className='text-rose-600 font-medium'>Sí</span> : 'No'}</Row>
        <Row label='Estadía recomendada'>{ti.recommendedStayDays ? `${ti.recommendedStayDays} días` : '—'}</Row>
      </Section>

      {/* Clima */}
      <Section title='Clima'>
        <Row label='Tipo'>{climate.type || '—'}</Row>
        <Row label='Temperatura'>{climate.averageTemperatureC != null ? `${climate.averageTemperatureC}°C` : '—'}</Row>
        <Row label='Mejores meses'><TagList items={climate.bestMonthsToVisit} color='blue' /></Row>
      </Section>

      {/* Stats */}
      <Section title='Estadísticas'>
        <div className='space-y-3'>
          <StatBar label='Índice de seguridad' value={stats.safetyIndex ?? 0} max={100} />
        </div>
        <div className='mt-3'>
          <Row label='Visitantes anuales'>{stats.annualVisitorsMillions != null ? `${stats.annualVisitorsMillions}M` : '—'}</Row>
          <Row label='Budget diario'>USD {stats.averageDailyBudgetUSD ?? '—'}</Row>
        </div>
      </Section>

      {/* Contenido */}
      <Section title='Contenido editorial'>
        <div className='space-y-3'>
          <div>
            <p className='text-xs text-muted mb-1.5'>Highlights</p>
            <TagList items={destination.highlights} color='orange' />
          </div>
          <div>
            <p className='text-xs text-muted mb-1.5'>Estilos de viaje</p>
            <TagList items={destination.travelStyles} color='blue' />
          </div>
        </div>
      </Section>

      {/* SEO */}
      <Section title='SEO'>
        <Row label='Meta title'><span className='text-xs'>{seo.metaTitle || '—'}</span></Row>
        <Row label='Meta description'><span className='text-xs text-muted'>{seo.metaDescription || '—'}</span></Row>
      </Section>

      {/* Acciones */}
      <div className='px-5 py-4 flex gap-2 border-t border-default'>
        <Link
          href={`/admin/destinos/${destination.slug}/editar`}
          onClick={onClose}
          className='flex-1 h-9 flex items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold'
        >
          Editar destino
        </Link>
        <Link
          href={`/destinos/${destination.slug}`}
          target='_blank'
          className='h-9 px-4 flex items-center justify-center rounded-lg border border-default text-sm hover:bg-surface-secondary transition-colors'
        >
          Ver pública →
        </Link>
      </div>
    </AdminDrawer>
  );
}
