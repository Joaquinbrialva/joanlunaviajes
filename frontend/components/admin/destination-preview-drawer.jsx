'use client';

import Link from 'next/link';
import { LuShield, LuThermometer, LuLanguages } from 'react-icons/lu';
import PreviewModal from './preview-modal';
import PreviewHero from './preview-hero';

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
  const statsData = destination.stats || {};
  const seo = destination.seo || {};

  const badges = [
    {
      label: destination.status === 'published' ? 'Publicado' : 'Borrador',
      variant: destination.status === 'published' ? 'published' : 'draft',
    },
  ];
  if (destination.isPopular) badges.push({ label: '🔥 Popular', variant: 'popular' });
  if (destination.isFeatured) badges.push({ label: '⭐ Destacado', variant: 'featured' });

  const heroStats = [];
  if (statsData.safetyIndex != null) heroStats.push({ icon: LuShield, text: `Seguridad ${statsData.safetyIndex}` });
  if (climate.averageTemperatureC != null) heroStats.push({ icon: LuThermometer, text: `${climate.averageTemperatureC}°C` });
  if (ti.language) heroStats.push({ icon: LuLanguages, text: ti.language });

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose}>
      <PreviewHero
        image={destination.featuredImage}
        title={destination.name}
        meta={[{ text: [destination.country, destination.continent].filter(Boolean).join(' · ') }]}
        badges={badges}
        stats={heroStats}
        onClose={onClose}
      />

      <div className='flex-1 overflow-y-auto min-h-0'>
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
            <StatBar label='Índice de seguridad' value={statsData.safetyIndex ?? 0} max={100} />
          </div>
          <div className='mt-3'>
            <Row label='Visitantes anuales'>{statsData.annualVisitorsMillions != null ? `${statsData.annualVisitorsMillions}M` : '—'}</Row>
            <Row label='Budget diario'>USD {statsData.averageDailyBudgetUSD ?? '—'}</Row>
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
      </div>

      {/* Acciones */}
      <div className='shrink-0 px-5 py-4 flex gap-2 border-t border-default bg-surface'>
        <Link
          href={`/admin/destinos/${destination.slug}/editar`}
          onClick={onClose}
          className='flex-1 h-9 flex items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-semibold'
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
    </PreviewModal>
  );
}
