'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip, Spinner } from '@heroui/react';
import { FaStar } from 'react-icons/fa';
import { LuClock3, LuMapPin, LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import Footer from '@/components/inicio/sections/Footer';
import HeroSelect from '@/components/ui/hero-select';

const ITEMS_PER_PAGE = 9;

const DURATION_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'short', label: '1–3 días' },
  { value: 'week', label: '1 semana' },
  { value: 'long', label: '2 sem+' },
];

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatCardPrice(amount, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDurationBucket(days) {
  if (days <= 3) return 'short';
  if (days <= 8) return 'week';
  return 'long';
}

function getVisiblePages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, '…', total];
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function OffersPage() {
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price-asc');
  const [durationFilter, setDurationFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [onlyDirect, setOnlyDirect] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setOffersData(data); })
      .catch(() => { if (active) setOffersData([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const globalMin = useMemo(() => {
    const prices = offersData.map(getOfferPrice).filter(Boolean);
    return prices.length ? Math.floor(Math.min(...prices)) : 0;
  }, [offersData]);

  const globalMax = useMemo(() => {
    const prices = offersData.map(getOfferPrice).filter(Boolean);
    return prices.length ? Math.ceil(Math.max(...prices)) : 999999;
  }, [offersData]);

  const destinationStats = useMemo(() => {
    const map = new Map();
    for (const o of offersData) map.set(o.location.country, (map.get(o.location.country) || 0) + 1);
    return [...map.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [offersData]);

  const specialOffer = useMemo(() => offersData.find((o) => o.isSpecialOffer) || null, [offersData]);

  const parsedMin = minPrice !== '' ? Number(minPrice) : globalMin;
  const parsedMax = maxPrice !== '' ? Number(maxPrice) : globalMax;

  const hasActiveFilters = durationFilter !== 'all' || selectedDestinations.length > 0 || minPrice !== '' || maxPrice !== '' || search !== '' || onlyDirect || onlyDiscount || onlyFeatured;

  const activeFilterCount =
    (durationFilter !== 'all' ? 1 : 0) +
    selectedDestinations.length +
    (minPrice || maxPrice ? 1 : 0) +
    (search ? 1 : 0) +
    (onlyDirect ? 1 : 0) +
    (onlyDiscount ? 1 : 0) +
    (onlyFeatured ? 1 : 0);

  const filteredOffers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let next = offersData.filter((offer) => {
      const price = getOfferPrice(offer);
      const destMatch = selectedDestinations.length === 0 || selectedDestinations.includes(offer.location.country);
      const durMatch = durationFilter === 'all' || getDurationBucket(offer.duration.days) === durationFilter;
      const priceMatch = price >= parsedMin && price <= parsedMax;
      const searchMatch =
        q.length === 0 ||
        offer.title?.toLowerCase().includes(q) ||
        offer.subtitle?.toLowerCase().includes(q) ||
        offer.location?.city?.toLowerCase().includes(q) ||
        offer.location?.country?.toLowerCase().includes(q) ||
        offer.airline?.name?.toLowerCase().includes(q) ||
        offer.includes?.some((s) => s.toLowerCase().includes(q));
      const directMatch = !onlyDirect || offer.flight?.type === 'direct';
      const discountMatch = !onlyDiscount || (offer.pricing?.discountPercentage > 0);
      const featuredMatch = !onlyFeatured || offer.isFeatured;
      return destMatch && durMatch && priceMatch && searchMatch && directMatch && discountMatch && featuredMatch;
    });
    return [...next].sort((a, b) => {
      if (sortBy === 'price-asc') return getOfferPrice(a) - getOfferPrice(b);
      if (sortBy === 'price-desc') return getOfferPrice(b) - getOfferPrice(a);
      if (sortBy === 'rating') return b.rating.value - a.rating.value;
      if (sortBy === 'duration-asc') return a.duration.days - b.duration.days;
      if (sortBy === 'duration-desc') return b.duration.days - a.duration.days;
      return 0;
    });
  }, [durationFilter, parsedMin, parsedMax, selectedDestinations, sortBy, offersData, search, onlyDirect, onlyDiscount, onlyFeatured]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleOffers = filteredOffers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function resetFilters() {
    setDurationFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedDestinations([]);
    setSearch('');
    setOnlyDirect(false);
    setOnlyDiscount(false);
    setOnlyFeatured(false);
    setPage(1);
  }

  function toggleDestination(country) {
    setPage(1);
    setSelectedDestinations((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  }

  const FilterPanel = () => (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-semibold uppercase tracking-widest text-muted'>Filtros</span>
        {hasActiveFilters && (
          <button onClick={resetFilters} className='text-xs text-accent font-medium flex items-center gap-1 hover:underline'>
            <LuX size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* Duración */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Duración</p>
        <div className='flex flex-wrap gap-1.5'>
          {DURATION_OPTIONS.map((opt) => {
            const active = durationFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setDurationFilter(opt.value); setPage(1); }}
                className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destinos */}
      {destinationStats.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Destinos</p>
          <div className='flex flex-wrap gap-1.5'>
            {destinationStats.map((item) => {
              const active = selectedDestinations.includes(item.country);
              return (
                <button
                  key={item.country}
                  onClick={() => toggleDestination(item.country)}
                  className={`h-7 px-2.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${active ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'
                    }`}
                >
                  {item.country}
                  <span className={`rounded-full px-1 text-[10px] font-bold ${active ? 'bg-white/25' : 'bg-default'}`}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Precio */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Precio</p>
        <div className='flex items-center gap-1.5'>
          <input
            type='number'
            placeholder='Desde'
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className='w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent'
          />
          <span className='text-muted text-xs shrink-0'>–</span>
          <input
            type='number'
            placeholder='Hasta'
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className='w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent'
          />
        </div>
      </div>

      {/* Opciones rápidas */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Opciones</p>
        <div className='flex flex-wrap gap-1.5'>
          {[
            { label: 'Vuelo directo', state: onlyDirect, toggle: () => { setOnlyDirect((v) => !v); setPage(1); } },
            { label: 'Con descuento', state: onlyDiscount, toggle: () => { setOnlyDiscount((v) => !v); setPage(1); } },
            { label: 'Destacadas', state: onlyFeatured, toggle: () => { setOnlyFeatured((v) => !v); setPage(1); } },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={opt.toggle}
              className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all ${opt.state ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Oferta especial */}
      {specialOffer && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Oferta especial</p>
          <Link href={`/ofertas/${specialOffer.slug}`} className='group block'>
            <div className='relative rounded-xl overflow-hidden h-36'>
              <Image
                src={specialOffer.images?.[0]?.url || `https://picsum.photos/seed/${specialOffer.slug}/500/300`}
                alt={specialOffer.title}
                fill
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-0 bg-linear-to-t from-black/75 to-black/10 p-3 flex flex-col justify-end'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-orange-200 mb-1'>Destacada</span>
                <p className='text-white font-bold text-sm leading-tight line-clamp-2'>{specialOffer.title}</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-0'>
      <section className='grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start'>

        {/* Sidebar desktop */}
        <aside className='hidden lg:block sticky top-24 pt-1'>
          <div className='rounded-2xl border border-default bg-surface p-4'>
            <FilterPanel />
          </div>
        </aside>

        {/* Main */}
        <main className='space-y-5 pt-1'>

          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold tracking-tight'>Todas las ofertas</h1>
              <p className='text-sm text-muted font-medium'>
                {loading ? 'Cargando...' : `${filteredOffers.length} paquete${filteredOffers.length !== 1 ? 's' : ''} disponible${filteredOffers.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className='shrink-0'>
              <HeroSelect
                value={sortBy}
                onValueChange={(v) => { setSortBy(v); setPage(1); }}
                options={[
                  { value: 'price-asc', label: 'Precio ↑' },
                  { value: 'price-desc', label: 'Precio ↓' },
                  { value: 'rating', label: 'Mejor puntuadas' },
                  { value: 'duration-asc', label: 'Duración ↑' },
                  { value: 'duration-desc', label: 'Duración ↓' },
                ]}
                triggerClassName='h-10 rounded-xl border border-default bg-surface px-4 text-sm w-44 shadow-sm'
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <LuSearch size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none' />
              <input
                type='text'
                placeholder='Buscar por destino, aerolínea, incluye...'
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className='w-full h-9 pl-9 pr-3 rounded-xl border border-default bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent'
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='lg:hidden h-9 px-3 rounded-xl border border-default bg-surface text-sm flex items-center gap-1.5 shrink-0'
            >
              <LuSlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className='bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {sidebarOpen && (
            <div className='lg:hidden rounded-2xl border border-default bg-surface p-4'>
              <FilterPanel />
            </div>
          )}

          {hasActiveFilters && (
            <div className='flex flex-wrap gap-1.5'>
              {search && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setSearch('')}>
                  &ldquo;{search}&rdquo; ✕
                </Chip>
              )}
              {durationFilter !== 'all' && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setDurationFilter('all')}>
                  {DURATION_OPTIONS.find((o) => o.value === durationFilter)?.label} ✕
                </Chip>
              )}
              {selectedDestinations.map((d) => (
                <Chip key={d} className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => toggleDestination(d)}>
                  {d} ✕
                </Chip>
              ))}
              {(minPrice || maxPrice) && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
                  Precio personalizado ✕
                </Chip>
              )}
              {onlyDirect && <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setOnlyDirect(false)}>Vuelo directo ✕</Chip>}
              {onlyDiscount && <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setOnlyDiscount(false)}>Con descuento ✕</Chip>}
              {onlyFeatured && <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setOnlyFeatured(false)}>Destacadas ✕</Chip>}
            </div>
          )}

          {loading ? (
            <div className='flex justify-center py-24'><Spinner size='lg' /></div>
          ) : visibleOffers.length === 0 ? (
            <div className='flex flex-col items-center py-24 gap-3 text-center'>
              <p className='text-lg font-semibold'>Sin resultados</p>
              <p className='text-sm text-muted'>Probá con otros filtros o buscá otro destino.</p>
              <Button className='bg-accent text-white px-6 mt-1' onClick={resetFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
              {visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-1 pt-2'>
              <button
                onClick={() => { if (safePage > 1) setPage((p) => p - 1); }}
                disabled={safePage === 1}
                className='h-9 w-9 rounded-lg border border-default text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors'
              >
                ‹
              </button>
              {getVisiblePages(safePage, totalPages).map((entry, idx) =>
                entry === '…' ? (
                  <span key={`e-${idx}`} className='h-9 w-9 flex items-center justify-center text-muted text-sm'>…</span>
                ) : (
                  <button
                    key={entry}
                    onClick={() => setPage(entry)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${entry === safePage ? 'bg-accent text-white' : 'border border-default hover:bg-surface-secondary'
                      }`}
                  >
                    {entry}
                  </button>
                )
              )}
              <button
                onClick={() => { if (safePage < totalPages) setPage((p) => p + 1); }}
                disabled={safePage === totalPages}
                className='h-9 w-9 rounded-lg border border-default text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors'
              >
                ›
              </button>
            </div>
          )}
        </main>
      </section>

      <Footer />
    </div >
  );
}

function OfferCard({ offer }) {
  const price = getOfferPrice(offer);
  const originalPrice = offer.pricing?.originalPrice;
  const discount = offer.pricing?.discountPercentage;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const fullStars = Math.round(offer.rating?.value || 0);

  return (
    <Link
      href={`/ofertas/${offer.slug}`}
      className="
    group block rounded-xl border border-default bg-surface
    transition-all duration-300 ease-out
    hover:-translate-y-1 hover:shadow-lg
  "
    >
      <div className="flex flex-col overflow-hidden">
        <div className='relative h-48 shrink-0 overflow-hidden rounded-t-xl'>
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt || offer.title}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'
              className='rounded-t-xl object-cover transition-transform duration-700 group-hover:scale-105'
            />
          ) : (
            <div className='h-full w-full rounded-t-xl bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none' />

          {discount ? (
            <span className='absolute top-2.5 left-2.5 bg-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full'>
              -{discount}% OFF
            </span>
          ) : offer.isFeatured ? (
            <span className='absolute top-2.5 left-2.5 bg-white/90 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full'>
              Más vendida
            </span>
          ) : null}

          <div className='absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white text-xs font-medium drop-shadow'>
            <LuMapPin size={11} className='shrink-0' />
            <span className='truncate max-w-[150px]'>{offer.location.city}, {offer.location.country}</span>
          </div>
        </div>

        <div className='p-4 flex flex-col flex-1'>
          <div className='flex items-center justify-between mb-2.5'>
            <div className='flex items-center gap-0.5'>
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} size={11} className={i < fullStars ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'} />
              ))}
              <span className='ml-1 text-xs text-muted'>{offer.rating?.value}</span>
            </div>
            <span className='text-xs text-muted flex items-center gap-1'>
              <LuClock3 size={11} /> {offer.duration.days} días
            </span>
          </div>

          <h3 className='font-bold text-sm leading-snug line-clamp-2 h-10 mb-2 group-hover:text-accent transition-colors'>
            {offer.title}
          </h3>

          <div className='flex-1' />

          <div className='flex items-end justify-between gap-2 pt-3 border-t border-default'>
            <div>
              {originalPrice && originalPrice > price ? (
                <p className='text-xs text-muted line-through leading-none mb-0.5'>
                  {formatCardPrice(originalPrice, offer.pricing.currency)}
                </p>
              ) : <div className='h-3.5' />}
              <p className='text-lg font-bold text-accent leading-none'>
                {formatCardPrice(price, offer.pricing.currency)}
              </p>
              <p className='text-xs text-muted mt-0.5'>/persona</p>
            </div>
            <span className='shrink-0 h-8 px-3.5 rounded-lg bg-accent text-white text-xs font-semibold flex items-center gap-1 transition-opacity group-hover:opacity-90'>
              Ver oferta
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
