'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Chip, Slider } from '@heroui/react';
import { LuPlane, LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import OfferCard from '@/components/offer-card';

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

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap shrink-0 ${active ? 'bg-brand-primary text-brand-primary-foreground border-brand-primary' : 'bg-surface-secondary border-border text-muted hover:border-brand-primary/40 hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

function OfferCardSkeleton() {
  return (
    <div className="h-full bg-surface rounded-[22px] overflow-hidden flex flex-col border border-border animate-pulse">
      <div className="h-52 bg-surface-secondary shrink-0" />
      <div className="px-5 pt-5 pb-5 flex flex-col grow">
        <div className="h-4 w-11/12 rounded-full bg-surface-secondary mb-2" />
        <div className="h-3.5 w-2/3 rounded-full bg-surface-secondary mb-4" />
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="h-6 w-24 rounded-full bg-surface-secondary" />
          <div className="h-10 w-10 rounded-full bg-surface-secondary" />
        </div>
      </div>
    </div>
  );
}

export default function OffersPageWrapper() {
  return <Suspense><OffersPage /></Suspense>;
}

function OffersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'price-asc');
  const [durationFilter, setDurationFilter] = useState(() => searchParams.get('dur') || 'all');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('max') || '');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') || '');
  const [page, setPage] = useState(1);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(dateTo);
  const [selectedDestinations, setSelectedDestinations] = useState(() => {
    const d = searchParams.get('dest');
    return d ? d.split(',').filter(Boolean) : [];
  });
  const [onlyDirect, setOnlyDirect] = useState(() => searchParams.get('direct') === '1');
  const [onlyDiscount, setOnlyDiscount] = useState(() => searchParams.get('discount') === '1');
  const [onlyFeatured, setOnlyFeatured] = useState(() => searchParams.get('featured') === '1');

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setOffersData(data); })
      .catch(() => { if (active) setOffersData([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (durationFilter !== 'all') params.set('dur', durationFilter);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (sortBy !== 'price-asc') params.set('sort', sortBy);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (selectedDestinations.length > 0) params.set('dest', selectedDestinations.join(','));
    if (onlyDirect) params.set('direct', '1');
    if (onlyDiscount) params.set('discount', '1');
    if (onlyFeatured) params.set('featured', '1');
    const qs = params.toString();
    router.replace(qs ? `/ofertas?${qs}` : '/ofertas', { scroll: false });
  }, [search, durationFilter, dateFrom, dateTo, sortBy, minPrice, maxPrice, selectedDestinations, onlyDirect, onlyDiscount, onlyFeatured, router]);

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

  const totalCountries = useMemo(() => new Set(offersData.map((o) => o.location?.country).filter(Boolean)).size, [offersData]);

  const parsedMin = minPrice !== '' ? Number(minPrice) : globalMin;
  const parsedMax = maxPrice !== '' ? Number(maxPrice) : globalMax;
  const hasPriceFilter = minPrice !== '' || maxPrice !== '';

  const parsedDraftMin = draftMinPrice !== '' ? Number(draftMinPrice) : globalMin;
  const parsedDraftMax = draftMaxPrice !== '' ? Number(draftMaxPrice) : globalMax;

  const hasActiveFilters = durationFilter !== 'all' || selectedDestinations.length > 0 || minPrice !== '' || maxPrice !== '' || search !== '' || onlyDirect || onlyDiscount || onlyFeatured || dateFrom !== '' || dateTo !== '';

  const activeFilterCount =
    (durationFilter !== 'all' ? 1 : 0) + selectedDestinations.length + (minPrice || maxPrice ? 1 : 0) +
    (search ? 1 : 0) + (onlyDirect ? 1 : 0) + (onlyDiscount ? 1 : 0) + (onlyFeatured ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

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
      const dateMatch = (() => {
        if (!dateFrom && !dateTo) return true;
        const availStart = offer.availability?.startDate;
        const availEnd = offer.availability?.endDate;
        if (!availStart || !availEnd) return false;
        if (dateFrom && availEnd < dateFrom) return false;
        if (dateTo && availStart > dateTo) return false;
        return true;
      })();
      return destMatch && durMatch && priceMatch && searchMatch && directMatch && discountMatch && featuredMatch && dateMatch;
    });
    return [...next].sort((a, b) => {
      if (sortBy === 'price-asc') return getOfferPrice(a) - getOfferPrice(b);
      if (sortBy === 'price-desc') return getOfferPrice(b) - getOfferPrice(a);
      if (sortBy === 'duration-asc') return a.duration.days - b.duration.days;
      if (sortBy === 'duration-desc') return b.duration.days - a.duration.days;
      return 0;
    });
  }, [durationFilter, parsedMin, parsedMax, hasPriceFilter, selectedDestinations, sortBy, offersData, search, onlyDirect, onlyDiscount, onlyFeatured, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleOffers = filteredOffers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function resetFilters() {
    setDurationFilter('all'); setMinPrice(''); setMaxPrice(''); setSelectedDestinations([]);
    setSearch(''); setDateFrom(''); setDateTo(''); setOnlyDirect(false); setOnlyDiscount(false); setOnlyFeatured(false); setPage(1);
    setDraftMinPrice(''); setDraftMaxPrice(''); setDraftDateFrom(''); setDraftDateTo('');
  }
  function toggleDestination(country) {
    setPage(1);
    setSelectedDestinations((prev) => prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]);
  }
  function openMoreFilters() {
    setDraftMinPrice(minPrice); setDraftMaxPrice(maxPrice); setDraftDateFrom(dateFrom); setDraftDateTo(dateTo);
    setMoreFiltersOpen(true);
  }
  function applyMoreFilters() {
    setMinPrice(draftMinPrice); setMaxPrice(draftMaxPrice); setDateFrom(draftDateFrom); setDateTo(draftDateTo);
    setPage(1);
    setMoreFiltersOpen(false);
  }

  const otherDestinations = destinationStats.slice(5);

  const renderMoreFilters = () => (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-semibold text-foreground">Precio (USD)</p>
          {globalMax > globalMin && (
            <p className="text-[13px] font-bold text-brand-primary">
              {parsedDraftMin.toLocaleString('es-AR')} – {parsedDraftMax.toLocaleString('es-AR')}
            </p>
          )}
        </div>
        {globalMax > globalMin ? (
          <Slider
            value={[parsedDraftMin, parsedDraftMax]}
            minValue={globalMin}
            maxValue={globalMax}
            step={Math.max(1, Math.round((globalMax - globalMin) / 100))}
            onChange={([lo, hi]) => {
              setDraftMinPrice(lo <= globalMin ? '' : String(lo));
              setDraftMaxPrice(hi >= globalMax ? '' : String(hi));
            }}
            className="py-1.5"
          >
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider>
        ) : (
          <p className="text-[13px] text-muted">USD {globalMin.toLocaleString('es-AR')}</p>
        )}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-foreground mb-2">Fecha de viaje</p>
        <RangeDatePickerField
          startDate={draftDateFrom}
          endDate={draftDateTo}
          endLabel={null}
          placeholder="Cualquier fecha"
          onChange={({ start, end }) => { setDraftDateFrom(start); setDraftDateTo(end); }}
        />
      </div>

      {otherDestinations.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">Más destinos</p>
          <div className="flex flex-wrap gap-1.5">
            {otherDestinations.map((item) => (
              <FilterPill key={item.country} active={selectedDestinations.includes(item.country)} onClick={() => toggleDestination(item.country)}>
                {item.country} <span className="opacity-70">· {item.count}</span>
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex-1 h-10 rounded-xl border border-border bg-surface text-[13px] font-bold text-foreground">
            Limpiar
          </button>
        )}
        <button onClick={applyMoreFilters} className="flex-1 h-10 rounded-xl border-none bg-brand-primary text-brand-primary-foreground text-[13px] font-bold">
          Ver resultados
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-16 md:pb-24">
      {/* Header de página */}
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-brand-primary/[0.08] via-surface to-brand-secondary/[0.08] p-6 md:p-10 mb-8 min-h-[150px] md:min-h-[196px] flex items-center">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-brand-primary/20 blur-[90px] pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-16 w-64 h-64 rounded-full bg-brand-secondary/20 blur-[90px] pointer-events-none hidden md:block" aria-hidden="true" />

        <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 1304 196" fill="none" preserveAspectRatio="none">
          <path d="M 90 150 C 420 30, 780 260, 1230 70" stroke="var(--brand-primary)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
          <circle cx="90" cy="150" r="4" fill="var(--brand-primary)" fillOpacity="0.5" />
          <circle cx="1230" cy="70" r="4" fill="var(--brand-primary)" fillOpacity="0.5" />
          <g transform="translate(1230,70) rotate(-24)">
            <path d="M14.5 21.7 a.5.5 0 0 0 .9 -.02l6.5 -19a.5.5 0 0 0 -.6 -.6l-19 6.5a.5.5 0 0 0 -.03.9l7.9 3.2a2 2 0 0 1 1.1 1.1z" fill="none" stroke="var(--brand-primary)" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>

        <div className="relative flex flex-col md:flex-row md:items-end justify-between w-full gap-6 md:gap-8">
          <div className="min-w-0 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-brand-primary mb-3">
              <LuPlane size={12} strokeWidth={2.5} />
              Catálogo completo
            </span>
            <h1 className="font-extrabold leading-[1.05] tracking-tight text-foreground" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
              Todas las ofertas
            </h1>
            <p className="text-sm text-muted mt-2.5">Los paquetes más solicitados, listos para reservar hoy.</p>
          </div>

          <div className="flex items-center shrink-0">
            {loading ? (
              <>
                <div className="text-center px-6 animate-pulse">
                  <div className="h-7 w-10 mx-auto rounded-md bg-surface-secondary" />
                  <div className="h-[11px] w-14 mx-auto mt-2 rounded bg-surface-secondary" />
                </div>
                <div className="w-px h-10 border-l border-dashed border-border" />
                <div className="text-center px-6 animate-pulse">
                  <div className="h-7 w-10 mx-auto rounded-md bg-surface-secondary" />
                  <div className="h-[11px] w-14 mx-auto mt-2 rounded bg-surface-secondary" />
                </div>
              </>
            ) : (
              <>
                <div className="text-center px-6">
                  <div className="text-[28px] font-extrabold text-foreground leading-none">{offersData.length}</div>
                  <div className="text-[11px] text-muted mt-1.5 font-semibold">{offersData.length === 1 ? 'paquete' : 'paquetes'}</div>
                </div>
                <div className="w-px h-10 border-l border-dashed border-border" />
                <div className="text-center px-6">
                  <div className="text-[28px] font-extrabold text-foreground leading-none">{totalCountries}</div>
                  <div className="text-[11px] text-muted mt-1.5 font-semibold">{totalCountries === 1 ? 'destino' : 'destinos'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de filtros sticky: buscador + orden + botón "Filtros" con panel bajo demanda */}
      <div className="sticky top-4 z-20 rounded-[22px] border border-border bg-surface shadow-sm p-3.5 mb-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <LuSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por destino, aerolínea, incluye..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/50"
            />
          </div>
          <div className="shrink-0">
            <HeroSelect
              value={sortBy}
              onValueChange={(v) => { setSortBy(v); setPage(1); }}
              options={[
                { value: 'price-asc', label: 'Precio ↑' },
                { value: 'price-desc', label: 'Precio ↓' },
                { value: 'duration-asc', label: 'Duración ↑' },
                { value: 'duration-desc', label: 'Duración ↓' },
              ]}
              triggerClassName="h-11 rounded-xl border border-border bg-surface px-3 sm:px-4 text-sm w-32 sm:w-40"
            />
          </div>
          <button
            onClick={() => (moreFiltersOpen ? setMoreFiltersOpen(false) : openMoreFilters())}
            className={`relative h-11 px-4 rounded-xl border text-sm font-bold flex items-center gap-2 shrink-0 transition-colors ${moreFiltersOpen ? 'bg-brand-primary border-brand-primary text-brand-primary-foreground' : 'bg-surface border-border text-foreground'}`}
          >
            <LuSlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-primary text-brand-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Chips rápidos: duración, destinos top, opciones — reemplaza el sidebar fijo */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-dashed border-border overflow-x-auto no-scrollbar">
          {DURATION_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
            <FilterPill key={opt.value} active={durationFilter === opt.value} onClick={() => { setDurationFilter(durationFilter === opt.value ? 'all' : opt.value); setPage(1); }}>
              {opt.label}
            </FilterPill>
          ))}
          <span className="w-px h-5 bg-border shrink-0 mx-0.5" />
          <FilterPill active={onlyDirect} onClick={() => { setOnlyDirect((v) => !v); setPage(1); }}>Vuelo directo</FilterPill>
          <FilterPill active={onlyDiscount} onClick={() => { setOnlyDiscount((v) => !v); setPage(1); }}>Con descuento</FilterPill>
          <FilterPill active={onlyFeatured} onClick={() => { setOnlyFeatured((v) => !v); setPage(1); }}>Destacadas</FilterPill>
          {destinationStats.slice(0, 5).length > 0 && <span className="w-px h-5 bg-border shrink-0 mx-0.5" />}
          {destinationStats.slice(0, 5).map((item) => (
            <FilterPill key={item.country} active={selectedDestinations.includes(item.country)} onClick={() => toggleDestination(item.country)}>
              {item.country} <span className="opacity-70">· {item.count}</span>
            </FilterPill>
          ))}
        </div>

        {/* Panel "Más filtros": popover en desktop, hoja inferior en mobile */}
        {moreFiltersOpen && (
          <>
            <div onClick={() => setMoreFiltersOpen(false)} className="fixed inset-0 z-30 bg-black/30" />
            <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl lg:absolute lg:inset-auto lg:bottom-auto lg:top-full lg:right-0 lg:mt-2 lg:w-[400px] lg:rounded-2xl lg:border lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-foreground text-[15px]">Más filtros</span>
                <button onClick={() => setMoreFiltersOpen(false)} className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center">
                  <LuX size={13} />
                </button>
              </div>
              {renderMoreFilters()}
            </div>
          </>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {search && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setSearch('')}>&quot;{search}&quot; ✕</Chip>}
          {durationFilter !== 'all' && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setDurationFilter('all')}>{DURATION_OPTIONS.find((o) => o.value === durationFilter)?.label} ✕</Chip>}
          {selectedDestinations.map((d) => <Chip key={d} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => toggleDestination(d)}>{d} ✕</Chip>)}
          {(minPrice || maxPrice) && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Precio ✕</Chip>}
          {(dateFrom || dateTo) && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => { setDateFrom(''); setDateTo(''); }}>Fechas ✕</Chip>}
          {onlyDirect && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDirect(false)}>Vuelo directo ✕</Chip>}
          {onlyDiscount && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDiscount(false)}>Con descuento ✕</Chip>}
          {onlyFeatured && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyFeatured(false)}>Destacadas ✕</Chip>}
        </div>
      )}

      {!loading && (
        <p className="text-sm text-muted font-medium mb-4">
          {filteredOffers.length} paquete{filteredOffers.length !== 1 ? 's' : ''} disponible{filteredOffers.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <OfferCardSkeleton key={i} />)}
        </div>
      ) : visibleOffers.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-3 text-center rounded-[28px] border border-dashed border-border">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-1">
            <LuPlane size={20} className="text-brand-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">Sin resultados</p>
          <p className="text-sm text-muted">Prueba con otros filtros o busca otro destino.</p>
          <Button className="bg-brand-primary text-brand-primary-foreground px-6 mt-1 rounded-xl" onClick={resetFilters}>Limpiar filtros</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-10">
          <button onClick={() => { if (safePage > 1) setPage((p) => p - 1); }} disabled={safePage === 1}
            className="h-9 w-9 rounded-full border-2 border-dashed border-border text-sm flex items-center justify-center disabled:opacity-40 hover:border-brand-primary hover:text-brand-primary transition-colors">‹</button>
          {getVisiblePages(safePage, totalPages).map((entry, idx) =>
            entry === '…' ? (
              <span key={`e-${idx}`} className="h-9 w-9 flex items-center justify-center text-muted text-sm">…</span>
            ) : (
              <button key={entry} onClick={() => setPage(entry)}
                className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${entry === safePage ? 'bg-brand-primary text-brand-primary-foreground' : 'border border-border hover:border-brand-primary hover:text-brand-primary'}`}>
                {entry}
              </button>
            )
          )}
          <button onClick={() => { if (safePage < totalPages) setPage((p) => p + 1); }} disabled={safePage === totalPages}
            className="h-9 w-9 rounded-full border-2 border-dashed border-border text-sm flex items-center justify-center disabled:opacity-40 hover:border-brand-primary hover:text-brand-primary transition-colors">›</button>
        </div>
      )}
    </div>
  );
}
