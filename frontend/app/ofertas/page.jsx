'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip, Spinner, TextField, Input } from '@heroui/react';
import { LuArrowRight, LuSearch, LuSlidersHorizontal, LuX, LuListFilter } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import DatePickerField from '@/components/ui/date-picker-field';
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
  const [dateFilter, setDateFilter] = useState(() => searchParams.get('date') || '');
  const [page, setPage] = useState(1);
  const [selectedDestinations, setSelectedDestinations] = useState(() => {
    const d = searchParams.get('dest');
    return d ? d.split(',').filter(Boolean) : [];
  });
  const [onlyDirect, setOnlyDirect] = useState(() => searchParams.get('direct') === '1');
  const [onlyDiscount, setOnlyDiscount] = useState(() => searchParams.get('discount') === '1');
  const [onlyFeatured, setOnlyFeatured] = useState(() => searchParams.get('featured') === '1');
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (durationFilter !== 'all') params.set('dur', durationFilter);
    if (dateFilter) params.set('date', dateFilter);
    if (sortBy !== 'price-asc') params.set('sort', sortBy);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (selectedDestinations.length > 0) params.set('dest', selectedDestinations.join(','));
    if (onlyDirect) params.set('direct', '1');
    if (onlyDiscount) params.set('discount', '1');
    if (onlyFeatured) params.set('featured', '1');
    const qs = params.toString();
    router.replace(qs ? `/ofertas?${qs}` : '/ofertas', { scroll: false });
  }, [search, durationFilter, dateFilter, sortBy, minPrice, maxPrice, selectedDestinations, onlyDirect, onlyDiscount, onlyFeatured, router]);

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
      className={`h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-all ${active ? 'bg-brand-primary text-brand-primary-foreground border-brand-primary' : 'bg-surface-secondary border-border text-muted hover:border-brand-primary/40 hover:text-foreground'}`}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-6 pb-4 md:pb-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-bold text-foreground text-[15px]">
          <LuListFilter size={16} className="text-brand-primary" />
          Filtros
        </span>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-brand-primary font-semibold flex items-center gap-1 hover:underline">
            <LuX size={11} /> Limpiar
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-foreground">Fecha de viaje</p>
        <DatePickerField value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1); }} placeholder="Cualquier fecha" />
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-foreground">Duración</p>
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
          <p className="text-[13px] font-semibold text-foreground">Destinos</p>
          <div className="flex flex-wrap gap-1.5">
            {destinationStats.map((item) => (
              <button
                key={item.country}
                onClick={() => toggleDestination(item.country)}
                className={`h-8 px-3 rounded-full text-[13px] font-semibold border transition-all flex items-center gap-1.5 ${selectedDestinations.includes(item.country) ? 'bg-brand-primary text-brand-primary-foreground border-brand-primary' : 'bg-surface-secondary border-border text-muted hover:border-brand-primary/40 hover:text-foreground'}`}
              >
                {item.country}
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${selectedDestinations.includes(item.country) ? 'bg-white/25' : 'bg-default'}`}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-foreground">Precio</p>
        <div className="flex items-center gap-2">
          <TextField value={minPrice} onChange={(v) => { setMinPrice(v); setPage(1); }} aria-label="Precio desde" fullWidth>
            <Input type="number" placeholder="Desde" className="h-9 rounded-lg text-[13px] px-3" />
          </TextField>
          <span className="text-muted text-xs shrink-0">–</span>
          <TextField value={maxPrice} onChange={(v) => { setMaxPrice(v); setPage(1); }} aria-label="Precio hasta" fullWidth>
            <Input type="number" placeholder="Hasta" className="h-9 rounded-lg text-[13px] px-3" />
          </TextField>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-foreground">Opciones</p>
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
          <p className="text-[13px] font-semibold text-foreground">Oferta especial</p>
          <Link href={`/ofertas/${specialOffer.slug}`} className="group block">
            <div className="relative rounded-xl overflow-hidden h-36">
              <Image src={specialOffer.images?.[0]?.url || `https://picsum.photos/seed/${specialOffer.slug}/500/300`}
                alt={specialOffer.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 p-3 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary-foreground/70 mb-1">Destacada</span>
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
          Todas las ofertas
        </h1>
        <p className="text-sm text-muted mt-2">Paquetes armados a medida, listos para reservar.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block sticky top-24 pt-1">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <FilterPanel />
          </div>
        </aside>

        <main className="space-y-5 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {loading ? 'Cargando...' : `${filteredOffers.length} paquete${filteredOffers.length !== 1 ? 's' : ''} disponible${filteredOffers.length !== 1 ? 's' : ''}`}
            </p>
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
                triggerClassName="h-10 rounded-xl border border-border bg-surface px-4 text-sm w-44 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LuSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por destino, aerolínea, incluye..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-surface text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/50"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-11 px-4 rounded-xl border border-border bg-surface text-sm flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <LuSlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-brand-primary text-brand-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {sidebarOpen && (
            <div className="lg:hidden rounded-2xl border border-border bg-surface p-5">
              <FilterPanel />
            </div>
          )}

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5">
              {search && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setSearch('')}>"{search}" ✕</Chip>}
              {durationFilter !== 'all' && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setDurationFilter('all')}>{DURATION_OPTIONS.find((o) => o.value === durationFilter)?.label} ✕</Chip>}
              {selectedDestinations.map((d) => <Chip key={d} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => toggleDestination(d)}>{d} ✕</Chip>)}
              {(minPrice || maxPrice) && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>Precio ✕</Chip>}
              {dateFilter && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setDateFilter('')}>{new Date(dateFilter + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })} ✕</Chip>}
              {onlyDirect && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDirect(false)}>Vuelo directo ✕</Chip>}
              {onlyDiscount && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyDiscount(false)}>Con descuento ✕</Chip>}
              {onlyFeatured && <Chip className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyFeatured(false)}>Destacadas ✕</Chip>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : visibleOffers.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-3 text-center rounded-2xl border border-dashed border-border">
              <p className="text-lg font-bold text-foreground">Sin resultados</p>
              <p className="text-sm text-muted">Prueba con otros filtros o busca otro destino.</p>
              <Button color="primary" className="px-6 mt-1" onClick={resetFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button onClick={() => { if (safePage > 1) setPage((p) => p - 1); }} disabled={safePage === 1}
                className="h-9 w-9 rounded-lg border border-border text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">‹</button>
              {getVisiblePages(safePage, totalPages).map((entry, idx) =>
                entry === '…' ? (
                  <span key={`e-${idx}`} className="h-9 w-9 flex items-center justify-center text-muted text-sm">…</span>
                ) : (
                  <button key={entry} onClick={() => setPage(entry)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${entry === safePage ? 'bg-brand-primary text-brand-primary-foreground' : 'border border-border hover:bg-surface-secondary'}`}>
                    {entry}
                  </button>
                )
              )}
              <button onClick={() => { if (safePage < totalPages) setPage((p) => p + 1); }} disabled={safePage === totalPages}
                className="h-9 w-9 rounded-lg border border-border text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">›</button>
            </div>
          )}

          {/* Banner cotización a medida */}
          <div className="mt-12 rounded-2xl border border-brand-primary/15 bg-gradient-to-br from-brand-primary/8 to-brand-secondary/5 px-6 py-9 text-center">
            <p className="text-lg font-bold text-foreground mb-1">¿No encontraste lo que buscas?</p>
            <p className="text-sm text-muted mb-5 max-w-sm mx-auto">Armamos tu viaje a medida con el destino, fechas y presupuesto que necesitas.</p>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-brand-primary text-brand-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors shadow-md shadow-brand-primary/25"
            >
              Arma tu viaje a medida <LuArrowRight size={14} />
            </Link>
          </div>
        </main>
      </section>
    </div>
  );
}

