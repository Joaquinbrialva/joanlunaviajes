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

function TagList({ items, color = 'emerald' }) {
  if (!items?.length) return <span className='text-muted text-sm'>—</span>;
  const cls = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }[color];
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {items.map((item, i) => (
        <li key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{item}</li>
      ))}
    </ul>
  );
}

function formatPrice(amount, currency) {
  if (!amount) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function OfferPreviewDrawer({ offer, isOpen, onClose }) {
  if (!offer) return null;

  const pricing = offer.pricing || {};
  const avail = offer.availability || {};
  const cover = offer.images?.find((i) => i.isCover)?.url;

  return (
    <AdminDrawer isOpen={isOpen} onClose={onClose} title='Vista de oferta — Admin'>

      {/* Cover */}
      {cover && (
        <div className='relative h-40 bg-surface-secondary overflow-hidden'>
          <img src={cover} alt={offer.title} className='w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
          <div className='absolute bottom-3 left-5 right-5'>
            <p className='text-white font-bold text-lg leading-tight'>{offer.title}</p>
            <p className='text-white/70 text-xs mt-0.5'>{offer.location?.city}, {offer.location?.country}</p>
          </div>
        </div>
      )}
      {!cover && (
        <div className='px-5 py-4 border-b border-default'>
          <p className='font-bold text-lg'>{offer.title}</p>
          <p className='text-sm text-muted'>{offer.location?.city}, {offer.location?.country}</p>
        </div>
      )}

      {/* Badges */}
      <div className='flex gap-2 px-5 py-3 border-b border-default flex-wrap'>
        {offer.isFeatured && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>⭐ Destacada</span>}
        {offer.isPopular && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>🔥 Popular</span>}
        {avail.limitedSpots && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'>⚠ Cupos limitados</span>}
      </div>

      {/* Identidad */}
      <Section title='Identificación'>
        <Row label='ID'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{offer.id}</code></Row>
        <Row label='Slug'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{offer.slug}</code></Row>
        <Row label='Subtítulo'>{offer.subtitle || '—'}</Row>
        <Row label='Creado'>{offer.createdAt ? new Date(offer.createdAt).toLocaleDateString('es-AR') : '—'}</Row>
        <Row label='Actualizado'>{offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString('es-AR') : '—'}</Row>
      </Section>

      {/* Disponibilidad */}
      <Section title='Disponibilidad'>
        <Row label='Fecha salida'>{avail.startDate ? new Date(avail.startDate).toLocaleDateString('es-AR') : '—'}</Row>
        <Row label='Fecha regreso'>{avail.endDate ? new Date(avail.endDate).toLocaleDateString('es-AR') : '—'}</Row>
        <Row label='Duración'>{offer.duration?.days} días / {offer.duration?.nights} noches</Row>
        <Row label='Cupos restantes'>
          <span className={avail.remainingSpots <= 3 ? 'text-rose-600 font-semibold' : ''}>{avail.remainingSpots ?? '—'}</span>
        </Row>
        <Row label='Aeropuerto destino'>{offer.location?.airport || '—'}</Row>
      </Section>

      {/* Precios */}
      <Section title='Precios'>
        <Row label='Moneda'>{pricing.currency || '—'}</Row>
        {pricing.price != null && <Row label='Precio'>{formatPrice(pricing.price, pricing.currency)}</Row>}
        {pricing.finalPrice != null && <Row label='Precio final'>{formatPrice(pricing.finalPrice, pricing.currency)}</Row>}
        {pricing.originalPrice != null && <Row label='Precio original'>{formatPrice(pricing.originalPrice, pricing.currency)}</Row>}
        {pricing.discountPercentage != null && <Row label='Descuento'>{pricing.discountPercentage}%</Row>}
        <Row label='Por'>{pricing.pricePer || '—'}</Row>
        <Row label='Cuotas'>{pricing.installments?.available ? 'Sí' : 'No'}</Row>
      </Section>

      {/* Hotel */}
      <Section title='Alojamiento'>
        <Row label='Hotel'>{offer.hotel?.name || '—'}</Row>
        <Row label='Estrellas'>{'★'.repeat(offer.hotel?.stars || 0) || '—'}</Row>
        <Row label='Tipo habitación'>{offer.hotel?.roomType || '—'}</Row>
        <Row label='Amenities'><TagList items={offer.hotel?.amenities} color='orange' /></Row>
      </Section>

      {/* Contenido */}
      <Section title='Contenido'>
        <div className='space-y-3'>
          <div>
            <p className='text-xs text-muted mb-1.5'>Incluye</p>
            <TagList items={offer.includes} color='emerald' />
          </div>
          <div>
            <p className='text-xs text-muted mb-1.5'>No incluye</p>
            <TagList items={offer.notIncludes} color='rose' />
          </div>
          <div>
            <p className='text-xs text-muted mb-1.5'>Highlights</p>
            <TagList items={offer.highlights} color='orange' />
          </div>
        </div>
      </Section>

      {/* Política */}
      <Section title='Política'>
        <Row label='Reembolsable'>{offer.cancellationPolicy?.refundable ? 'Sí' : 'No'}</Row>
        <Row label='Rating'>{offer.rating?.value ?? '—'} ({offer.rating?.reviewsCount ?? 0} reseñas)</Row>
        <Row label='Categoría'>{offer.category || '—'}</Row>
        <Row label='Tags'><TagList items={offer.tags} color='orange' /></Row>
      </Section>

      {/* Acciones */}
      <div className='px-5 py-4 flex gap-2 border-t border-default'>
        <Link
          href={`/admin/ofertas/${offer.slug}/editar`}
          onClick={onClose}
          className='flex-1 h-9 flex items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold'
        >
          Editar oferta
        </Link>
        <Link
          href={`/ofertas/${offer.slug}`}
          target='_blank'
          className='h-9 px-4 flex items-center justify-center rounded-lg border border-default text-sm hover:bg-surface-secondary transition-colors'
        >
          Ver pública →
        </Link>
      </div>
    </AdminDrawer>
  );
}
