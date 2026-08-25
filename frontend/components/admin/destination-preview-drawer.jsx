'use client';

import { LuFlame, LuGlobe, LuStar } from 'react-icons/lu';
import { Panel, PreviewHeader, DetailRow, DetailSection, TagPills, LinkButton } from '@/components/admin/kit';

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
  if (destination.isPopular) tags.push({ label: 'Popular', icon: LuFlame, color: 'danger' });
  if (destination.isFeatured) tags.push({ label: 'Destacado', icon: LuStar, color: 'accent' });

  return (
    <Panel
      isOpen={isOpen}
      onClose={onClose}
      header={
        <PreviewHeader
          image={destination.featuredImage}
          fallbackIcon={LuGlobe}
          title={destination.city}
          statusColor={destination.status === 'published' ? 'success' : 'default'}
          statusLabel={destination.status === 'published' ? 'Publicado' : 'Borrador'}
          meta={[destination.title, destination.country, destination.continent].filter(Boolean)}
          tags={tags}
        />
      }
      footer={
        <div className='flex w-full gap-2.5'>
          <LinkButton href={`/admin/destinos/${destination.slug}/editar`} onClick={onClose} className='flex-1'>
            Editar destino
          </LinkButton>
          <LinkButton href={`/destinos/${destination.slug}`} target='_blank' variant='tertiary'>
            Ver pública
          </LinkButton>
        </div>
      }
    >
      <div className='divide-y divide-default'>
        <DetailSection title='Identificación'>
          <DetailRow label='ID'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{destination.id}</code></DetailRow>
          <DetailRow label='Slug'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{destination.slug}</code></DetailRow>
          <DetailRow label='Descripción corta'><span className='text-muted'>{destination.shortDescription || '—'}</span></DetailRow>
          <DetailRow label='Creado'>{destination.createdAt ? new Date(destination.createdAt).toLocaleDateString('es-AR') : '—'}</DetailRow>
          <DetailRow label='Actualizado'>{destination.updatedAt ? new Date(destination.updatedAt).toLocaleDateString('es-AR') : '—'}</DetailRow>
        </DetailSection>

        <DetailSection title='Información de viaje'>
          <DetailRow label='Aeropuerto (IATA)'><code className='rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{ti.airport || '—'}</code></DetailRow>
          <DetailRow label='Moneda'>{ti.currency || '—'}</DetailRow>
          <DetailRow label='Idioma'>{ti.language || '—'}</DetailRow>
          <DetailRow label='Zona horaria'><span className='text-xs text-muted'>{ti.timezone || '—'}</span></DetailRow>
          <DetailRow label='Visa requerida'>{ti.visaRequired ? <span className='font-medium text-rose-600'>Sí</span> : 'No'}</DetailRow>
          <DetailRow label='Estadía recomendada'>{ti.recommendedStayDays ? `${ti.recommendedStayDays} días` : '—'}</DetailRow>
        </DetailSection>

        <DetailSection title='Clima'>
          <DetailRow label='Tipo'>{climate.type || '—'}</DetailRow>
          <DetailRow label='Temperatura'>{climate.averageTemperatureC != null ? `${climate.averageTemperatureC}°C` : '—'}</DetailRow>
          <DetailRow label='Mejores meses'><TagPills items={climate.bestMonthsToVisit} /></DetailRow>
        </DetailSection>

        <DetailSection title='Estadísticas'>
          <div className='space-y-3'>
            <StatBar label='Índice de seguridad' value={statsData.safetyIndex ?? 0} max={100} />
          </div>
          <div className='mt-3'>
            <DetailRow label='Visitantes anuales'>{statsData.annualVisitorsMillions != null ? `${statsData.annualVisitorsMillions}M` : '—'}</DetailRow>
            <DetailRow label='Budget diario'>USD {statsData.averageDailyBudgetUSD ?? '—'}</DetailRow>
          </div>
        </DetailSection>

        <DetailSection title='Contenido editorial'>
          <div className='space-y-3'>
            <div>
              <p className='mb-1.5 text-xs text-muted'>Highlights</p>
              <TagPills items={destination.highlights} tone='accent' />
            </div>
            <div>
              <p className='mb-1.5 text-xs text-muted'>Estilos de viaje</p>
              <TagPills items={destination.travelStyles} />
            </div>
          </div>
        </DetailSection>

        <DetailSection title='SEO'>
          <DetailRow label='Meta title'><span className='text-xs'>{seo.metaTitle || '—'}</span></DetailRow>
          <DetailRow label='Meta description'><span className='text-xs text-muted'>{seo.metaDescription || '—'}</span></DetailRow>
        </DetailSection>
      </div>
    </Panel>
  );
}
