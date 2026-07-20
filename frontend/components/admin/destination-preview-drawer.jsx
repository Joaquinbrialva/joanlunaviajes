'use client';

import Link from 'next/link';
import { LuFlame, LuGlobe, LuStar } from 'react-icons/lu';
import PreviewPanel from './preview-panel';
import PreviewPanelHeader from './preview-panel-header';

function Row({ label, children }) {
  return (
    <div className='flex gap-4 border-b border-default py-2 last:border-0'>
      <span className='w-28 shrink-0 pt-0.5 text-xs text-muted'>{label}</span>
      <span className='min-w-0 flex-1 text-sm'>{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className='px-5 py-4'>
      <p className='mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted'>{title}</p>
      {children}
    </div>
  );
}

function TagList({ items, color = 'orange' }) {
  if (!items?.length) return <span className='text-sm text-muted'>—</span>;
  const cls = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }[color];
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {items.map((item, i) => (
        <li key={i} className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{item}</li>
      ))}
    </ul>
  );
}

function StatBar({ label, value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className='mb-1 flex justify-between text-xs'>
        <span className='text-muted'>{label}</span>
        <span className='font-medium tabular-nums'>{value}</span>
      </div>
      <div className='h-1.5 overflow-hidden rounded-full bg-surface-tertiary'>
        <div className='h-full rounded-full bg-accent' style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DestinationPreviewDrawer({ destination, isOpen, onClose }) {
  if (!destination) return null;

  const ti = destination.travelInfo || {};
  const climate = destination.climate || {};
  const statsData = destination.stats || {};
  const seo = destination.seo || {};

  const tags = [];
  if (destination.isPopular) tags.push({ label: 'Popular', icon: LuFlame });
  if (destination.isFeatured) tags.push({ label: 'Destacado', icon: LuStar });

  return (
    <PreviewPanel isOpen={isOpen} onClose={onClose}>
      <PreviewPanelHeader
        image={destination.featuredImage}
        fallbackIcon={LuGlobe}
        title={destination.name}
        status={{
          label: destination.status === 'published' ? 'Publicado' : 'Borrador',
          tone: destination.status === 'published' ? 'success' : 'neutral',
        }}
        meta={[destination.country, destination.continent].filter(Boolean)}
        tags={tags}
        onClose={onClose}
      />

      <div className='min-h-0 flex-1 divide-y divide-default overflow-y-auto'>
        <Section title='Identificación'>
          <Row label='ID'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{destination.id}</code></Row>
          <Row label='Slug'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{destination.slug}</code></Row>
          <Row label='Descripción corta'><span className='text-muted'>{destination.shortDescription || '—'}</span></Row>
          <Row label='Creado'>{destination.createdAt ? new Date(destination.createdAt).toLocaleDateString('es-AR') : '—'}</Row>
          <Row label='Actualizado'>{destination.updatedAt ? new Date(destination.updatedAt).toLocaleDateString('es-AR') : '—'}</Row>
        </Section>

        <Section title='Información de viaje'>
          <Row label='Aeropuerto (IATA)'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{ti.airport || '—'}</code></Row>
          <Row label='Moneda'>{ti.currency || '—'}</Row>
          <Row label='Idioma'>{ti.language || '—'}</Row>
          <Row label='Zona horaria'><span className='text-xs text-muted'>{ti.timezone || '—'}</span></Row>
          <Row label='Visa requerida'>{ti.visaRequired ? <span className='font-medium text-rose-600'>Sí</span> : 'No'}</Row>
          <Row label='Estadía recomendada'>{ti.recommendedStayDays ? `${ti.recommendedStayDays} días` : '—'}</Row>
        </Section>

        <Section title='Clima'>
          <Row label='Tipo'>{climate.type || '—'}</Row>
          <Row label='Temperatura'>{climate.averageTemperatureC != null ? `${climate.averageTemperatureC}°C` : '—'}</Row>
          <Row label='Mejores meses'><TagList items={climate.bestMonthsToVisit} color='blue' /></Row>
        </Section>

        <Section title='Estadísticas'>
          <div className='space-y-3'>
            <StatBar label='Índice de seguridad' value={statsData.safetyIndex ?? 0} max={100} />
          </div>
          <div className='mt-3'>
            <Row label='Visitantes anuales'>{statsData.annualVisitorsMillions != null ? `${statsData.annualVisitorsMillions}M` : '—'}</Row>
            <Row label='Budget diario'>USD {statsData.averageDailyBudgetUSD ?? '—'}</Row>
          </div>
        </Section>

        <Section title='Contenido editorial'>
          <div className='space-y-3'>
            <div>
              <p className='mb-1.5 text-xs text-muted'>Highlights</p>
              <TagList items={destination.highlights} color='orange' />
            </div>
            <div>
              <p className='mb-1.5 text-xs text-muted'>Estilos de viaje</p>
              <TagList items={destination.travelStyles} color='blue' />
            </div>
          </div>
        </Section>

        <Section title='SEO'>
          <Row label='Meta title'><span className='text-xs'>{seo.metaTitle || '—'}</span></Row>
          <Row label='Meta description'><span className='text-xs text-muted'>{seo.metaDescription || '—'}</span></Row>
        </Section>
      </div>

      <div className='flex shrink-0 gap-2 border-t border-default bg-surface px-5 py-3'>
        <Link
          href={`/admin/destinos/${destination.slug}/editar`}
          onClick={onClose}
          className='flex h-9 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground'
        >
          Editar destino
        </Link>
        <Link
          href={`/destinos/${destination.slug}`}
          target='_blank'
          className='flex h-9 items-center justify-center rounded-lg border border-default px-4 text-sm transition-colors hover:bg-surface-secondary'
        >
          Ver pública →
        </Link>
      </div>
    </PreviewPanel>
  );
}
