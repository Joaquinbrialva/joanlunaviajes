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
  if (!items?.length) return <span className='text-muted text-sm'>-</span>;
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

function formatPrice(amount, currency) {
  if (amount == null) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-AR');
}

function buildLuggageLabel(luggage) {
  const labels = [
    luggage?.personal && 'Articulo personal',
    luggage?.carryOn && 'Carry on',
    luggage?.checked && 'Despachado',
  ].filter(Boolean);
  return labels.length ? labels.join(', ') : '-';
}

export default function OfferPreviewDrawer({ offer, isOpen, onClose }) {
  if (!offer) return null;

  const pricing = offer.pricing || {};
  const availability = offer.availability || {};
  const hotel = offer.hotel || {};
  const origin = offer.origin || {};
  const airline = offer.airline || {};
  const flight = offer.flight || {};
  const luggage = offer.luggage || {};
  const cover = offer.images?.find((image) => image.isCover)?.url || offer.images?.[0]?.url;

  return (
    <AdminDrawer isOpen={isOpen} onClose={onClose} title='Vista de oferta — Admin'>
      {cover ? (
        <div className='relative h-40 bg-surface-secondary overflow-hidden'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={offer.title} className='w-full h-full object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
          <div className='absolute bottom-3 left-5 right-5'>
            <p className='text-white font-bold text-lg leading-tight'>{offer.title}</p>
            <p className='text-white/70 text-xs mt-0.5'>{offer.location?.city}, {offer.location?.country}</p>
          </div>
        </div>
      ) : (
        <div className='px-5 py-4 border-b border-default'>
          <p className='font-bold text-lg'>{offer.title}</p>
          <p className='text-sm text-muted'>{offer.location?.city}, {offer.location?.country}</p>
        </div>
      )}

      <div className='flex gap-2 px-5 py-3 border-b border-default flex-wrap'>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${offer.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-secondary text-muted'}`}>
          {offer.status === 'published' ? 'Publicado' : 'Borrador'}
        </span>
        {offer.isFeatured && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'>Destacada</span>}
        {offer.isPopular && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>Popular</span>}
        {offer.isSpecialOffer && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'>Especial</span>}
        {availability.limitedSpots && <span className='px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'>Pocos cupos</span>}
      </div>

      <Section title='Identificación'>
        <Row label='ID'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{offer.id}</code></Row>
        <Row label='Slug'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{offer.slug}</code></Row>
        <Row label='Resumen'><span className='text-muted'>{offer.subtitle || '-'}</span></Row>
        <Row label='Categoría'>{offer.category || '-'}</Row>
        <Row label='Creado'>{formatDate(offer.createdAt)}</Row>
        <Row label='Actualizado'>{formatDate(offer.updatedAt)}</Row>
      </Section>

      <Section title='Ruta y fechas'>
        <Row label='Origen'>{origin.city ? `${origin.city}, ${origin.country || ''}` : (origin.country || '-')}</Row>
        <Row label='Destino'>{offer.location?.city}, {offer.location?.country}</Row>
        <Row label='Aeropuerto'>{offer.location?.airport || '-'}</Row>
        <Row label='Salida'>{formatDate(availability.startDate)}</Row>
        <Row label='Regreso'>{formatDate(availability.endDate)}</Row>
        <Row label='Duración'>{offer.duration?.days} días / {offer.duration?.nights} noches</Row>
      </Section>

      <Section title='Vuelo y equipaje'>
        <Row label='Aerolínea'>{airline.name || '-'}</Row>
        <Row label='IATA'>{airline.iata || '-'}</Row>
        <Row label='Tipo'>{flight.type === 'stops' ? 'Con escala' : 'Directo'}</Row>
        <Row label='Equipaje'>{buildLuggageLabel(luggage)}</Row>
      </Section>

      <Section title='Precio y cupos'>
        <Row label='Moneda'>{pricing.currency || '-'}</Row>
        <Row label='Precio base'>{formatPrice(pricing.price, pricing.currency)}</Row>
        <Row label='Precio final'>{formatPrice(pricing.finalPrice, pricing.currency)}</Row>
        <Row label='Precio original'>{formatPrice(pricing.originalPrice, pricing.currency)}</Row>
        <Row label='Descuento'>{pricing.discountPercentage != null ? `${pricing.discountPercentage}%` : '-'}</Row>
        <Row label='Aclaración'>{pricing.pricePer || '-'}</Row>
        <Row label='Cupos'>{availability.remainingSpots ?? '-'}</Row>
      </Section>

      <Section title='Alojamiento'>
        <Row label='Hotel'>{hotel.name || '-'}</Row>
        <Row label='Estrellas'>{hotel.stars ? `${hotel.stars}/5` : '-'}</Row>
        <Row label='Habitación'>{hotel.roomType || '-'}</Row>
        <Row label='Amenities'><TagList items={hotel.amenities} color='blue' /></Row>
      </Section>

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
          <div>
            <p className='text-xs text-muted mb-1.5'>Tags</p>
            <TagList items={offer.tags} color='blue' />
          </div>
        </div>
      </Section>

      <Section title='Publicación'>
        <Row label='Estado'>{offer.status === 'published' ? 'Publicado' : 'Borrador'}</Row>
        <Row label='Destacada'>{offer.isFeatured ? 'Sí' : 'No'}</Row>
        <Row label='Especial'>{offer.isSpecialOffer ? 'Sí' : 'No'}</Row>
        <Row label='Popular'>{offer.isPopular ? 'Sí' : 'No'}</Row>
      </Section>

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
