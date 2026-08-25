'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Chip, Skeleton } from '@heroui/react';
import {
  LuMapPin, LuClock, LuBriefcase,
  LuCheck, LuX, LuPlane, LuStar,
  LuPencil, LuArrowUpRight,
  LuFlame, LuGift,
} from 'react-icons/lu';
import { toastError } from '@/lib/toast';
import { PageHeader, Section, DetailRow, LinkButton } from '@/components/admin/kit';

function formatPrice(amount, currency) {
  if (amount == null) return null;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildLuggageItems(luggage) {
  return [
    luggage?.personal && 'Artículo personal',
    luggage?.carryOn && 'Carry-on',
    luggage?.checked && 'Despachado',
  ].filter(Boolean);
}

function StarRating({ stars }) {
  if (!stars) return <span className='text-sm text-muted'>—</span>;
  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <LuStar key={i} className={`h-3.5 w-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-surface-secondary text-surface-secondary'}`} />
      ))}
      <span className='ml-1.5 text-xs font-medium text-muted'>{stars}/5</span>
    </div>
  );
}

export default function OfferDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetch(`/api/ofertas/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.id) setOffer(data);
        else setNotFound(true);
      })
      .catch(() => { if (active) { setNotFound(true); toastError('No se pudo cargar la oferta.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-64 rounded-lg' />
        <Skeleton className='h-64 rounded-2xl' />
        <Skeleton className='h-48 rounded-2xl' />
      </div>
    );
  }

  if (notFound || !offer) {
    return (
      <div className='flex flex-col items-center gap-4 py-20 text-center'>
        <div className='grid h-14 w-14 place-content-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-900/30'>
          <LuX className='h-6 w-6' />
        </div>
        <div>
          <h2 className='text-2xl font-bold'>Oferta no encontrada</h2>
          <p className='mt-1 text-muted'>No existe ninguna oferta con este slug.</p>
        </div>
        <LinkButton href='/admin/ofertas'>Volver a ofertas</LinkButton>
      </div>
    );
  }

  const pricing = offer.pricing || {};
  const availability = offer.availability || {};
  const hotel = offer.hotel || {};
  const origin = offer.origin || {};
  const airline = offer.airline || {};
  const flight = offer.flight || {};
  const luggage = offer.luggage || {};
  const cover = offer.images?.find((img) => img.isCover)?.url || offer.images?.[0]?.url;

  const mainPrice = pricing.finalPrice || pricing.price;
  const origPrice = pricing.originalPrice;
  const hasDiscount = origPrice && mainPrice && origPrice > mainPrice;
  const discountPct = hasDiscount ? (pricing.discountPercentage ?? Math.round(((origPrice - mainPrice) / origPrice) * 100)) : null;
  const luggageItems = buildLuggageItems(luggage);
  const originCode = origin.iata || origin.city?.slice(0, 3).toUpperCase() || '???';
  const destCode = offer.location?.iata || offer.location?.city?.slice(0, 3).toUpperCase() || '???';
  const lowStock = availability.remainingSpots != null && availability.remainingSpots <= 3;

  const tags = [];
  if (offer.isFeatured) tags.push({ label: 'Destacada', icon: LuStar, color: 'accent' });
  if (offer.isSpecialOffer) tags.push({ label: 'Especial', icon: LuGift, color: 'warning' });
  if (offer.isPopular) tags.push({ label: 'Popular', icon: LuFlame, color: 'danger' });
  if (availability.limitedSpots) tags.push({ label: 'Pocos cupos', color: 'warning' });

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <PageHeader
        crumbs={[{ label: 'Ofertas', href: '/admin/ofertas' }, { label: offer.title }]}
        title={offer.title}
        description={offer.subtitle}
        actions={
          <div className='flex items-center gap-2'>
            <LinkButton href={`/ofertas/${offer.slug}`} target='_blank' variant='tertiary'>
              Ver pública
              <LuArrowUpRight className='h-3.5 w-3.5' />
            </LinkButton>
            <LinkButton href={`/admin/ofertas/${offer.slug}/editar`}>
              <LuPencil className='h-3.5 w-3.5' />
              Editar oferta
            </LinkButton>
          </div>
        }
      />

      <div className='flex flex-wrap items-center gap-2'>
        <Chip color={offer.status === 'published' ? 'success' : 'default'} size='sm'>
          <Chip.Label>{offer.status === 'published' ? 'Publicado' : 'Borrador'}</Chip.Label>
        </Chip>
        {offer.location && (
          <span className='inline-flex items-center gap-1 text-sm text-muted'>
            <LuMapPin className='h-3.5 w-3.5' />
            {[offer.location.city, offer.location.country].filter(Boolean).join(', ')}
          </span>
        )}
        {tags.map((t, i) => (
          <Chip key={i} color={t.color} variant='soft' size='sm'>
            <Chip.Label className='flex items-center gap-1'>
              {t.icon && <t.icon className='h-2.5 w-2.5' />}
              {t.label}
            </Chip.Label>
          </Chip>
        ))}
      </div>

      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={offer.title} className='h-64 w-full rounded-2xl object-cover md:h-80' />
      )}

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr] items-start'>
        <div className='space-y-6'>
          <Section title='Vuelo' bodyClassName='p-5'>
            <div className='overflow-hidden rounded-xl border border-default'>
              <div className='flex items-center gap-4 px-5 pb-4 pt-4'>
                <div className='min-w-[60px] text-center'>
                  <p className='font-mono text-2xl font-black leading-none tracking-tight'>{originCode}</p>
                  <p className='mt-1 text-xs leading-tight text-muted'>{origin.city || origin.country || '—'}</p>
                </div>
                <div className='flex flex-1 flex-col items-center gap-1'>
                  <div className='flex w-full items-center'>
                    <div className='h-px flex-1 border-t-2 border-dashed border-muted/25' />
                    <LuPlane className='mx-2 h-4 w-4 shrink-0 text-accent' />
                    <div className='h-px flex-1 border-t-2 border-dashed border-muted/25' />
                  </div>
                  <span className='text-xs font-medium text-muted'>
                    {flight.type === 'stops' ? (flight.layover ? `Escala en ${flight.layover}` : 'Con escala') : 'Directo'}
                  </span>
                </div>
                <div className='min-w-[60px] text-center'>
                  <p className='font-mono text-2xl font-black leading-none tracking-tight'>{destCode}</p>
                  <p className='mt-1 text-xs leading-tight text-muted'>{offer.location?.city || '—'}</p>
                </div>
              </div>
              {(airline.name || luggageItems.length > 0) && (
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-default bg-surface-secondary/50 px-5 py-3'>
                  {airline.name && (
                    <span className='flex items-center gap-1.5 text-sm'>
                      {airline.iata && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://pics.avs.io/60/60/${airline.iata}.png`} alt='' className='h-5 w-5 object-contain' onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <span className='font-medium text-foreground'>{airline.name}</span>
                    </span>
                  )}
                  {luggageItems.length > 0 && (
                    <span className='flex items-center gap-1.5 text-sm text-muted'>
                      <LuBriefcase className='h-3.5 w-3.5 shrink-0 text-accent/60' />
                      {luggageItems.join(' · ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Section>

          {(hotel.name || hotel.stars) && (
            <Section title='Alojamiento' bodyClassName='p-5 space-y-2.5'>
              <div className='flex items-start justify-between gap-3'>
                <p className='text-lg font-semibold leading-snug'>{hotel.name || '—'}</p>
                <StarRating stars={hotel.stars} />
              </div>
              {hotel.address && (
                <a
                  href={hotel.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(hotel.address)}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent'
                >
                  <LuMapPin className='h-3.5 w-3.5 shrink-0' />
                  {hotel.address}
                </a>
              )}
              {hotel.amenities?.length > 0 && (
                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {hotel.amenities.map((a, i) => (
                    <span key={i} className='rounded-md bg-surface-secondary px-2 py-0.5 text-xs font-medium text-foreground/70'>{a}</span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {(offer.includes?.length > 0 || offer.notIncludes?.length > 0) && (
            <Section title='Contenido' bodyClassName='p-5'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                {offer.includes?.length > 0 && (
                  <div>
                    <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted'>Incluye</p>
                    <ul className='space-y-1.5'>
                      {offer.includes.map((item, i) => (
                        <li key={i} className='flex items-start gap-1.5 text-sm leading-snug'>
                          <LuCheck className='mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {offer.notIncludes?.length > 0 && (
                  <div>
                    <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted'>No incluye</p>
                    <ul className='space-y-1.5'>
                      {offer.notIncludes.map((item, i) => (
                        <li key={i} className='flex items-start gap-1.5 text-sm leading-snug text-muted'>
                          <LuX className='mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400' />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {(offer.highlights?.length > 0 || offer.tags?.length > 0) && (
            <Section title='Highlights & tags' bodyClassName='p-5 space-y-3'>
              {offer.highlights?.length > 0 && (
                <div className='flex flex-wrap gap-1.5'>
                  {offer.highlights.map((h, i) => (
                    <span key={i} className='rounded-md bg-accent/10 px-2.5 py-1 text-[13px] font-semibold text-accent'>{h}</span>
                  ))}
                </div>
              )}
              {offer.tags?.length > 0 && (
                <div className='flex flex-wrap gap-1.5'>
                  {offer.tags.map((t, i) => (
                    <span key={i} className='rounded-md bg-surface-secondary px-2.5 py-1 text-[13px] font-medium text-muted'>#{t}</span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {offer.summary && (
            <Section title='Descripción' bodyClassName='p-5'>
              <p className='text-sm leading-relaxed text-foreground'>{offer.summary}</p>
            </Section>
          )}
        </div>

        <div className='space-y-6'>
          <Section title='Resumen' bodyClassName='p-5'>
            <div className='space-y-0.5'>
              <DetailRow label='Precio'>
                <span className='font-semibold tabular-nums'>{formatPrice(mainPrice, pricing.currency) || '—'}</span>
                {hasDiscount && (
                  <>
                    <span className='ml-2 text-xs text-muted line-through tabular-nums'>{formatPrice(origPrice, pricing.currency)}</span>
                    <span className='ml-1.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'>-{discountPct}%</span>
                  </>
                )}
              </DetailRow>
              <DetailRow label='Duración'>{offer.duration ? `${offer.duration.days}d / ${offer.duration.nights}n` : '—'}</DetailRow>
              <DetailRow label='Cupos'>
                <span className={lowStock ? 'font-semibold text-rose-600' : ''}>{availability.remainingSpots != null ? availability.remainingSpots : '—'}</span>
              </DetailRow>
            </div>
          </Section>

          {(availability.startDate || availability.endDate) && (
            <Section title='Fechas' bodyClassName='p-5'>
              <div className='grid grid-cols-2 gap-2.5'>
                <div className='rounded-lg border border-default p-2.5'>
                  <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted'>Salida</p>
                  <p className='text-sm font-semibold'>{formatDate(availability.startDate) || '—'}</p>
                </div>
                <div className='rounded-lg border border-default p-2.5'>
                  <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted'>Regreso</p>
                  <p className='text-sm font-semibold'>{formatDate(availability.endDate) || '—'}</p>
                </div>
              </div>
              {offer.duration && (
                <p className='mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted'>
                  <LuClock className='h-3 w-3' />
                  {offer.duration.days} días · {offer.duration.nights} noches
                </p>
              )}
            </Section>
          )}

          <Section title='Metadatos' bodyClassName='p-5'>
            <div className='space-y-0.5'>
              {[
                { label: 'ID', value: offer.id, mono: true },
                { label: 'Slug', value: offer.slug, mono: true },
                { label: 'Categoría', value: offer.category },
                { label: 'Creado', value: formatDate(offer.createdAt) },
                { label: 'Actualizado', value: formatDate(offer.updatedAt) },
              ].filter((r) => r.value).map(({ label, value, mono }) => (
                <DetailRow key={label} label={label}>
                  {mono ? <code className='truncate rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-xs'>{value}</code> : <span className='truncate text-sm'>{value}</span>}
                </DetailRow>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
