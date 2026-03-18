'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip, Spinner } from '@heroui/react';
import { FaStar } from 'react-icons/fa';
import { LuArrowRight, LuClock3, LuMapPin, LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import DatePickerField from '@/components/ui/date-picker-field';

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

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
    style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: 0,
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

export default function OffersPageWrapper() {
  return <Suspense><OffersPage /></Suspense>;
}

function OffersPage() {
  const searchParams = useSearchParams();
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price-asc');
  const [durationFilter, setDurationFilter] = useState(() => searchParams.get('dur') || 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [dateFilter, setDateFilter] = useState(() => searchParams.get('date') || '');
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
  const hasPriceFilter = minPrice !== '' || maxPrice !== '';

  const hasActiveFilters = durationFilter !== 'all' || selectedDestinations.length > 0 || minPrice !== '' || maxPrice !== '' || search !== '' || onlyDirect || onlyDiscount || onlyFeatured || dateFilter !== '';

  const activeFilterCount =
    (durationFilter !== 'all' ? 1 : 0) + selectedDestinations.length +
    (minPrice || maxPrice ? 1 : 0) + (search ? 1 : 0) +
    (onlyDirect ? 1 : 0) + (onlyDiscount ? 1 : 0) + (onlyFeatured ? 1 : 0) + (dateFilter ? 1 : 0);

  const filteredOffers = useMemo(() => {
    const normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') ?? '';
    const q = normalize(search.trim());
    let next = offersData.filter((offer) => {
      const price = getOfferPrice(offer);
      const destMatch = selectedDestinations.length === 0 || selectedDestinations.includes(offer.location.country);
      const durMatch = durationFilter === 'all' || getDurationBucket(offer.duration.days) === durationFilter;
      const priceMatch = !hasPriceFilter || (price >= parsedMin && price <= parsedMax);
      const searchMatch = q.length === 0 || normalize(offer.title).includes(q) || normalize(offer.subtitle).includes(q) ||
        normalize(offer.location?.city).includes(q) || normalize(offer.location?.country).includes(q) ||
        normalize(offer.airline?.name).includes(q) || offer.includes?.some((s) => normalize(s).includes(q));
      const directMatch = !onlyDirect || offer.flight?.type === 'direct';
      const discountMatch = !onlyDiscount || (offer.pricing?.discountPercentage > 0);
      const featuredMatch = !onlyFeatured || offer.isFeatured;
      const dateMatch = !dateFilter || (offer.availability?.startDate && offer.availability?.endDate &&
        dateFilter >= offer.availability.startDate && dateFilter <= offer.availability.endDate);
      return destMatch && durMatch && priceMatch && searchMatch && directMatch && discountMatch && featuredMatch && dateMatch;
    });
    return [...next].sort((a, b) => {
      if (sortBy === 'price-asc') return getOfferPrice(a) - getOfferPrice(b);
      if (sortBy === 'price-desc') return getOfferPrice(b) - getOfferPrice(a);
      if (sortBy === 'rating') return b.rating.value - a.rating.value;
      if (sortBy === 'duration-asc') return a.duration.days - b.duration.days;
      if (sortBy === 'duration-desc') return b.duration.days - a.duration.days;
      return 0;
    });
  }, [durationFilter, parsedMin, parsedMax, hasPriceFilter, selectedDestinations, sortBy, offersData, search, onlyDirect, onlyDiscount, onlyFeatured, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleOffers = filteredOffers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function resetFilters() {
    setDurationFilter('all'); setMinPrice(''); setMaxPrice(''); setSelectedDestinations([]);
    setSearch(''); setDateFilter(''); setOnlyDirect(false); setOnlyDiscount(false); setOnlyFeatured(false); setPage(1);
  }
  function toggleDestination(country) {
    setPage(1);
    setSelectedDestinations((prev) => prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]);
  }

  const PillBtn = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'}`}
      style={syne}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-5 pb-4 md:pb-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted" style={syne}>Filtros</span>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-accent font-medium flex items-center gap-1 hover:underline" style={syne}>
            <LuX size={11} /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Fecha de viaje</p>
        <DatePickerField value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1); }} placeholder="Cualquier fecha" />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Duración</p>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <PillBtn key={opt.value} active={durationFilter === opt.value} onClick={() => { setDurationFilter(opt.value); setPage(1); }}>
              {opt.label}
            </PillBtn>
          ))}
        </div>
      </div>

      {destinationStats.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Destinos</p>
          <div className="flex flex-wrap gap-1.5">
            {destinationStats.map((item) => (
              <button
                key={item.country}
                onClick={() => toggleDestination(item.country)}
                className={`h-7 px-2.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${selectedDestinations.includes(item.country) ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'}`}
                style={syne}
              >
                {item.country}
                <span className={`rounded-full px-1 text-[10px] font-bold ${selectedDestinations.includes(item.country) ? 'bg-white/25' : 'bg-default'}`}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Precio</p>
        <div className="flex items-center gap-1.5">
          <input type="number" placeholder="Desde" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className="w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent" style={syne} />
          <span className="text-muted text-xs shrink-0">–</span>
          <input type="number" placeholder="Hasta" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className="w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent" style={syne} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Opciones</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Vuelo directo', state: onlyDirect, toggle: () => { setOnlyDirect((v) => !v); setPage(1); } },
            { label: 'Con descuento', state: onlyDiscount, toggle: () => { setOnlyDiscount((v) => !v); setPage(1); } },
            { label: 'Destacadas', state: onlyFeatured, toggle: () => { setOnlyFeatured((v) => !v); setPage(1); } },
          ].map((opt) => (
            <PillBtn key={opt.label} active={opt.state} onClick={opt.toggle}>{opt.label}</PillBtn>
          ))}
        </div>
      </div>

      {specialOffer && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted" style={syne}>Oferta especial</p>
          <Link href={`/ofertas/${specialOffer.slug}`} className="group block">
            <div className="relative rounded-xl overflow-hidden h-36">
              <Image src={specialOffer.images?.[0]?.url || `https://picsum.photos/seed/${specialOffer.slug}/500/300`}
                alt={specialOffer.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 p-3 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 mb-1">Destacada</span>
                <p className="text-white font-bold text-sm leading-tight line-clamp-2">{specialOffer.title}</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-16 md:pb-24">
      {/* Header de página */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent mb-2" style={syne}>
          Paquetes exclusivos
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-foreground leading-none" style={cormorant}>
          Todas las <em className="font-semibold">ofertas</em>
        </h1>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block sticky top-24 pt-1">
          <div className="rounded-2xl border border-default bg-surface p-4">
            <FilterPanel />
          </div>
        </aside>

        <main className="space-y-5 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted" style={syne}>
              {loading ? 'Cargando...' : `${filteredOffers.length} paquete${filteredOffers.length !== 1 ? 's' : ''} disponible${filteredOffers.length !== 1 ? 's' : ''}`}
            </p>
            <div className="shrink-0">
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
                triggerClassName="h-10 rounded-xl border border-default bg-surface px-4 text-sm w-44 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por destino, aerolínea, incluye..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-default bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                style={syne}
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-10 px-3 rounded-xl border border-default bg-surface text-sm flex items-center gap-1.5 shrink-0"
              style={syne}
            >
              <LuSlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {sidebarOpen && (
            <div className="lg:hidden rounded-2xl border border-default bg-surface p-4">
              <FilterPanel />
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5">
              {search && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setSearch('')}>"{search}" ✕</Chip>}
              {durationFilter !== 'all' && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setDurationFilter('all')}>{DURATION_OPTIONS.find((o) => o.value === durationFilter)?.label} ✕</Chip>}
              {selectedDestinations.map((d) => <Chip key={d} className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => toggleDestination(d)}>{d} ✕</Chip>)}
              {(minPrice || maxPrice) && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Precio ✕</Chip>}
              {dateFilter && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setDateFilter('')}>{new Date(dateFilter + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })} ✕</Chip>}
              {onlyDirect && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDirect(false)}>Vuelo directo ✕</Chip>}
              {onlyDiscount && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDiscount(false)}>Con descuento ✕</Chip>}
              {onlyFeatured && <Chip className="bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6" onClick={() => setOnlyFeatured(false)}>Destacadas ✕</Chip>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : visibleOffers.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-3 text-center">
              <p className="text-lg font-semibold" style={syne}>Sin resultados</p>
              <p className="text-sm text-muted">Prueba con otros filtros o busca otro destino.</p>
              <Button className="bg-accent text-white px-6 mt-1" onClick={resetFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button onClick={() => { if (safePage > 1) setPage((p) => p - 1); }} disabled={safePage === 1}
                className="h-9 w-9 rounded-lg border border-default text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">‹</button>
              {getVisiblePages(safePage, totalPages).map((entry, idx) =>
                entry === '…' ? (
                  <span key={`e-${idx}`} className="h-9 w-9 flex items-center justify-center text-muted text-sm">…</span>
                ) : (
                  <button key={entry} onClick={() => setPage(entry)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${entry === safePage ? 'bg-accent text-white' : 'border border-default hover:bg-surface-secondary'}`}
                    style={syne}>
                    {entry}
                  </button>
                )
              )}
              <button onClick={() => { if (safePage < totalPages) setPage((p) => p + 1); }} disabled={safePage === totalPages}
                className="h-9 w-9 rounded-lg border border-default text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">›</button>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function OfferCard({ offer }) {
  const price = getOfferPrice(offer);
  const hasPrice = price > 0;
  const originalPrice = offer.pricing?.originalPrice;
  const discount = offer.pricing?.discountPercentage;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const fullStars = Math.round(offer.rating?.value || 0);

  return (
    <Link
      href={`/ofertas/${offer.slug}`}
      className="group block rounded-2xl overflow-hidden border border-default bg-surface hover:shadow-xl hover:shadow-black/8 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Imagen */}
      <div className="relative h-52 overflow-hidden">
        {cover?.url ? (
          <Image
            src={cover.url}
            alt={cover.alt || offer.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface-tertiary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

        {discount > 0 ? (
          <span className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full" style={syne}>-{discount}% OFF</span>
        ) : offer.isFeatured ? (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full" style={syne}>Más vendida</span>
        ) : null}

        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/75 text-xs" style={syne}>
          <LuMapPin size={10} className="shrink-0" />
          <span className="truncate max-w-[150px]">{offer.location.city}, {offer.location.country}</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar key={i} size={10} className={i < fullStars ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'} />
            ))}
            {offer.rating?.value > 0 && <span className="ml-1 text-xs text-muted" style={syne}>{offer.rating.value}</span>}
          </div>
          <span className="flex items-center gap-1 text-xs text-muted" style={syne}>
            <LuClock3 size={10} /> {offer.duration.days} días
          </span>
        </div>

        <h3 className="font-semibold text-[15px] text-foreground mb-3 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
          {offer.title}
        </h3>

        <div className="flex items-end justify-between pt-3 border-t border-default">
          <div>
            {hasPrice && originalPrice && originalPrice > price ? (
              <p className="text-xs text-muted line-through leading-none mb-0.5">
                {formatCardPrice(originalPrice, offer.pricing.currency)}
              </p>
            ) : <div className="h-3.5" />}
            {hasPrice ? (
              <>
                <p className="text-lg font-bold text-accent leading-none">
                  {formatCardPrice(price, offer.pricing.currency)}
                </p>
                <p className="text-[11px] text-muted mt-0.5">/persona</p>
              </>
            ) : (
              <div className="h-[2.25rem]" />
            )}
          </div>
          <span className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-[11px] font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-300 group-hover:bg-orange-500 group-hover:shadow-lg group-hover:shadow-orange-500/30 ${hasPrice ? '' : 'w-full'}`}>
            {hasPrice ? 'Ver oferta →' : 'Consultar precio →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
