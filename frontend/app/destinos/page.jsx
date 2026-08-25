'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip, Slider } from '@heroui/react';
import { LuCompass, LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import DestinationCard from '@/components/destination-card';

const ITEMS_PER_PAGE = 9;

function normalizeStyles(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.join(',').split(',').map((s) => s.trim()).filter(Boolean);
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
      className={`h-8 px-3.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap shrink-0 ${active ? 'bg-brand-secondary text-brand-secondary-foreground border-brand-secondary' : 'bg-surface-secondary border-border text-muted hover:border-brand-secondary/40 hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

export default function DestinationsPageWrapper() {
  return <Suspense><DestinationsPage /></Suspense>;
}

function DestinationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [destinationsData, setDestinationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [continent, setContinent] = useState(() => searchParams.get('cont') || 'all');
  const [selectedStyles, setSelectedStyles] = useState(() => {
    const s = searchParams.get('styles');
    return s ? s.split(',').filter(Boolean) : [];
  });
  const [selectedClimates, setSelectedClimates] = useState(() => {
    const c = searchParams.get('climates');
    return c ? c.split(',').filter(Boolean) : [];
  });
  const [minBudget, setMinBudget] = useState(() => searchParams.get('minb') || '');
  const [maxBudget, setMaxBudget] = useState(() => searchParams.get('maxb') || '');
  const [onlyPopular, setOnlyPopular] = useState(() => searchParams.get('popular') === '1');
  const [onlySafe, setOnlySafe] = useState(() => searchParams.get('safe') === '1');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'popular');
  const [page, setPage] = useState(1);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [draftMinBudget, setDraftMinBudget] = useState(minBudget);
  const [draftMaxBudget, setDraftMaxBudget] = useState(maxBudget);

  useEffect(() => {
    let active = true;
    fetch('/api/destinos')
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setDestinationsData(data); })
      .catch(() => { if (active) setDestinationsData([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (continent !== 'all') params.set('cont', continent);
    if (selectedStyles.length > 0) params.set('styles', selectedStyles.join(','));
    if (selectedClimates.length > 0) params.set('climates', selectedClimates.join(','));
    if (minBudget) params.set('minb', minBudget);
    if (maxBudget) params.set('maxb', maxBudget);
    if (onlyPopular) params.set('popular', '1');
    if (onlySafe) params.set('safe', '1');
    if (sortBy !== 'popular') params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(qs ? `/destinos?${qs}` : '/destinos', { scroll: false });
  }, [search, continent, selectedStyles, selectedClimates, minBudget, maxBudget, onlyPopular, onlySafe, sortBy, router]);

  const continents = useMemo(() => {
    const set = new Set(destinationsData.map((d) => d.continent).filter(Boolean));
    return [...set].sort();
  }, [destinationsData]);

  const allStyles = useMemo(() => {
    const set = new Set();
    for (const d of destinationsData) normalizeStyles(d.travelStyles).forEach((s) => set.add(s));
    return [...set].sort();
  }, [destinationsData]);

  const allClimates = useMemo(() => {
    const set = new Set(destinationsData.map((d) => d.climate?.type).filter(Boolean));
    return [...set].sort();
  }, [destinationsData]);

  const featuredDestination = useMemo(
    () => destinationsData.find((d) => d.isRecommended) || null,
    [destinationsData]
  );

  const globalMinBudget = useMemo(() => {
    const budgets = destinationsData.map((d) => d.stats?.averageDailyBudgetUSD).filter(Boolean);
    return budgets.length ? Math.floor(Math.min(...budgets)) : 0;
  }, [destinationsData]);

  const globalMaxBudget = useMemo(() => {
    const budgets = destinationsData.map((d) => d.stats?.averageDailyBudgetUSD).filter(Boolean);
    return budgets.length ? Math.ceil(Math.max(...budgets)) : 999;
  }, [destinationsData]);

  const parsedMinBudget = minBudget !== '' ? Number(minBudget) : globalMinBudget;
  const parsedMaxBudget = maxBudget !== '' ? Number(maxBudget) : globalMaxBudget;

  const parsedDraftMinBudget = draftMinBudget !== '' ? Number(draftMinBudget) : globalMinBudget;
  const parsedDraftMaxBudget = draftMaxBudget !== '' ? Number(draftMaxBudget) : globalMaxBudget;

  const hasActiveFilters =
    search !== '' || continent !== 'all' || selectedStyles.length > 0 ||
    selectedClimates.length > 0 || minBudget !== '' || maxBudget !== '' || onlyPopular || onlySafe;

  const activeFilterCount =
    (search ? 1 : 0) + (continent !== 'all' ? 1 : 0) + selectedStyles.length +
    selectedClimates.length + (minBudget || maxBudget ? 1 : 0) + (onlyPopular ? 1 : 0) + (onlySafe ? 1 : 0);

  const filteredDestinations = useMemo(() => {
    const normalize = (s) => s?.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') ?? '';
    const q = normalize(search.trim());
    let next = destinationsData.filter((d) => {
      const searchMatch = q.length === 0 || normalize(d.city).includes(q) || normalize(d.title).includes(q) || normalize(d.country).includes(q) ||
        normalize(d.shortDescription).includes(q) || normalize(d.continent).includes(q) ||
        normalizeStyles(d.travelStyles).some((s) => normalize(s).includes(q));
      const contMatch = continent === 'all' || d.continent === continent;
      const stylesMatch = selectedStyles.length === 0 || selectedStyles.every((s) => normalizeStyles(d.travelStyles).includes(s));
      const climateMatch = selectedClimates.length === 0 || selectedClimates.includes(d.climate?.type);
      const budget = d.stats?.averageDailyBudgetUSD ?? 0;
      const budgetMatch = budget >= parsedMinBudget && budget <= parsedMaxBudget;
      const popularMatch = !onlyPopular || d.isPopular;
      const safeMatch = !onlySafe || (d.stats?.safetyIndex ?? 0) >= 70;
      return searchMatch && contMatch && stylesMatch && climateMatch && budgetMatch && popularMatch && safeMatch;
    });
    return [...next].sort((a, b) => {
      if (sortBy === 'popular') return Number(b.isPopular) - Number(a.isPopular);
      if (sortBy === 'budget-asc') return (a.stats?.averageDailyBudgetUSD ?? 0) - (b.stats?.averageDailyBudgetUSD ?? 0);
      if (sortBy === 'budget-desc') return (b.stats?.averageDailyBudgetUSD ?? 0) - (a.stats?.averageDailyBudgetUSD ?? 0);
      if (sortBy === 'safety-desc') return (b.stats?.safetyIndex ?? 0) - (a.stats?.safetyIndex ?? 0);
      if (sortBy === 'stay-desc') return (b.travelInfo?.recommendedStayDays ?? 0) - (a.travelInfo?.recommendedStayDays ?? 0);
      return 0;
    });
  }, [search, continent, selectedStyles, selectedClimates, parsedMinBudget, parsedMaxBudget, onlyPopular, onlySafe, sortBy, destinationsData]);

  const totalPages = Math.max(1, Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleDestinations = filteredDestinations.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function resetFilters() {
    setSearch(''); setContinent('all'); setSelectedStyles([]); setSelectedClimates([]);
    setMinBudget(''); setMaxBudget(''); setOnlyPopular(false); setOnlySafe(false); setPage(1);
    setDraftMinBudget(''); setDraftMaxBudget('');
  }
  function toggleStyle(s) { setPage(1); setSelectedStyles((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]); }
  function toggleClimate(c) { setPage(1); setSelectedClimates((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]); }
  function openMoreFilters() {
    setDraftMinBudget(minBudget); setDraftMaxBudget(maxBudget);
    setMoreFiltersOpen(true);
  }
  function applyMoreFilters() {
    setMinBudget(draftMinBudget); setMaxBudget(draftMaxBudget);
    setPage(1);
    setMoreFiltersOpen(false);
  }

  const topStyles = allStyles.slice(0, 5);
  const otherStyles = allStyles.slice(5);

  const renderMoreFilters = () => (
    <div className="space-y-5">
      {allClimates.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">Clima</p>
          <div className="flex flex-wrap gap-1.5">
            {allClimates.map((c) => (
              <FilterPill key={c} active={selectedClimates.includes(c)} onClick={() => toggleClimate(c)}>{c}</FilterPill>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-semibold text-foreground">Presupuesto diario (USD)</p>
          {globalMaxBudget > globalMinBudget && (
            <p className="text-[13px] font-bold text-brand-secondary">
              {parsedDraftMinBudget.toLocaleString('es-AR')} – {parsedDraftMaxBudget.toLocaleString('es-AR')}
            </p>
          )}
        </div>
        {globalMaxBudget > globalMinBudget ? (
          <Slider
            value={[parsedDraftMinBudget, parsedDraftMaxBudget]}
            minValue={globalMinBudget}
            maxValue={globalMaxBudget}
            step={Math.max(1, Math.round((globalMaxBudget - globalMinBudget) / 100))}
            onChange={([lo, hi]) => {
              setDraftMinBudget(lo <= globalMinBudget ? '' : String(lo));
              setDraftMaxBudget(hi >= globalMaxBudget ? '' : String(hi));
            }}
            style={{ '--accent': 'var(--brand-secondary)', '--accent-foreground': 'var(--brand-secondary-foreground)' }}
            className="py-1.5"
          >
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb index={0} />
              <Slider.Thumb index={1} />
            </Slider.Track>
          </Slider>
        ) : (
          <p className="text-[13px] text-muted">USD {globalMinBudget.toLocaleString('es-AR')}</p>
        )}
      </div>

      {otherStyles.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">Más estilos</p>
          <div className="flex flex-wrap gap-1.5">
            {otherStyles.map((s) => (
              <FilterPill key={s} active={selectedStyles.includes(s)} onClick={() => toggleStyle(s)}>{s}</FilterPill>
            ))}
          </div>
        </div>
      )}

      {featuredDestination && (
        <div>
          <p className="text-[13px] font-semibold text-foreground mb-2">Recomendado</p>
          <Link href={`/destinos/${featuredDestination.slug}`} className="group block" onClick={() => setMoreFiltersOpen(false)}>
            <div className="relative rounded-xl overflow-hidden h-32">
              <Image src={featuredDestination.featuredImage || `https://picsum.photos/seed/${featuredDestination.slug}/500/300`}
                alt={featuredDestination.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10 p-3 flex flex-col justify-end">
                <p className="text-white font-bold text-sm leading-tight">{featuredDestination.name}, {featuredDestination.country}</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex-1 h-10 rounded-xl border border-border bg-surface text-[13px] font-bold text-foreground">
            Limpiar
          </button>
        )}
        <button onClick={applyMoreFilters} className="flex-1 h-10 rounded-xl border-none bg-brand-secondary text-brand-secondary-foreground text-[13px] font-bold">
          Ver resultados
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-16 md:pb-24">
      {/* Header de página */}
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-surface-secondary via-surface to-surface p-6 md:p-10 mb-8 min-h-[150px] md:min-h-[196px] flex items-center">
        <div className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full bg-brand-secondary/20 blur-3xl pointer-events-none" />

        <svg className="absolute -top-16 right-16 pointer-events-none hidden md:block" width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="120" stroke="var(--brand-secondary)" strokeOpacity="0.22" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="86" stroke="var(--brand-secondary)" strokeOpacity="0.16" strokeWidth="1.5" />
          <g stroke="var(--brand-secondary)" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round">
            <line x1="150" y1="18" x2="150" y2="42" />
            <line x1="150" y1="258" x2="150" y2="282" />
            <line x1="18" y1="150" x2="42" y2="150" />
            <line x1="258" y1="150" x2="282" y2="150" />
          </g>
          <path d="M150 90 L168 150 L150 210 L132 150 Z" fill="var(--brand-secondary)" fillOpacity="0.18" />
        </svg>

        <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 1304 196" fill="none" preserveAspectRatio="none">
          <path d="M 140 60 C 380 190, 640 20, 900 130 S 1180 60, 1240 140" stroke="var(--brand-secondary)" strokeOpacity="0.32" strokeWidth="2" strokeDasharray="1 9" strokeLinecap="round" />
          <circle cx="140" cy="60" r="3.5" fill="var(--brand-secondary)" fillOpacity="0.5" />
          <circle cx="900" cy="130" r="3.5" fill="var(--brand-secondary)" fillOpacity="0.5" />
          <circle cx="1240" cy="140" r="3.5" fill="var(--brand-secondary)" fillOpacity="0.5" />
        </svg>

        <div className="relative flex items-center justify-between w-full gap-6 md:gap-8">
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-brand-secondary to-[#0e8f9e] flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
              <LuCompass size={26} className="text-brand-secondary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-extrabold tracking-wider uppercase text-brand-secondary mb-1.5">Guía de destinos</span>
              <h1 className="text-3xl md:text-[42px] font-extrabold tracking-tight leading-[1.05] text-foreground">
                Todos los destinos
              </h1>
              <p className="text-sm text-muted mt-2">Los rincones del mundo que más eligen nuestros viajeros.</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center shrink-0">
            {loading ? (
              <>
                <div className="text-center px-6 animate-pulse">
                  <div className="h-7 w-10 mx-auto rounded-md bg-surface-secondary" />
                  <div className="h-[11px] w-14 mx-auto mt-2 rounded bg-surface-secondary" />
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center px-6 animate-pulse">
                  <div className="h-7 w-10 mx-auto rounded-md bg-surface-secondary" />
                  <div className="h-[11px] w-16 mx-auto mt-2 rounded bg-surface-secondary" />
                </div>
              </>
            ) : (
              <>
                <div className="text-center px-6">
                  <div className="text-[28px] font-extrabold text-foreground leading-none">{destinationsData.length}</div>
                  <div className="text-[11px] text-muted mt-1.5 font-semibold">{destinationsData.length === 1 ? 'destino' : 'destinos'}</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center px-6">
                  <div className="text-[28px] font-extrabold text-foreground leading-none">{continents.length}</div>
                  <div className="text-[11px] text-muted mt-1.5 font-semibold">{continents.length === 1 ? 'continente' : 'continentes'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de filtros sticky: buscador + orden + botón "Filtros" con panel bajo demanda */}
      <div className="sticky top-4 z-20 rounded-2xl border border-border bg-surface shadow-sm p-3.5 mb-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <LuSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, país, estilo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 focus:border-brand-secondary/50"
            />
          </div>
          <div className="shrink-0">
            <HeroSelect
              value={sortBy}
              onValueChange={(v) => { setSortBy(v); setPage(1); }}
              options={[
                { value: 'popular', label: 'Populares' },
                { value: 'budget-asc', label: 'Presupuesto ↑' },
                { value: 'budget-desc', label: 'Presupuesto ↓' },
                { value: 'safety-desc', label: 'Más seguros' },
                { value: 'stay-desc', label: 'Mayor estadía' },
              ]}
              triggerClassName="h-11 rounded-xl border border-border bg-surface px-3 sm:px-4 text-sm w-32 sm:w-44"
            />
          </div>
          <button
            onClick={() => (moreFiltersOpen ? setMoreFiltersOpen(false) : openMoreFilters())}
            className={`relative h-11 px-4 rounded-xl border text-sm font-bold flex items-center gap-2 shrink-0 transition-colors ${moreFiltersOpen ? 'bg-brand-secondary border-brand-secondary text-brand-secondary-foreground' : 'bg-surface border-border text-foreground'}`}
          >
            <LuSlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="bg-brand-secondary text-brand-secondary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Chips rápidos: continente, estilos top, opciones — reemplaza el sidebar fijo */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border overflow-x-auto no-scrollbar">
          <FilterPill active={continent === 'all'} onClick={() => { setContinent('all'); setPage(1); }}>Todos</FilterPill>
          {continents.map((c) => (
            <FilterPill key={c} active={continent === c} onClick={() => { setContinent(continent === c ? 'all' : c); setPage(1); }}>{c}</FilterPill>
          ))}
          <span className="w-px h-5 bg-border shrink-0 mx-0.5" />
          <FilterPill active={onlyPopular} onClick={() => { setOnlyPopular((v) => !v); setPage(1); }}>Populares</FilterPill>
          <FilterPill active={onlySafe} onClick={() => { setOnlySafe((v) => !v); setPage(1); }}>Alta seguridad</FilterPill>
          {topStyles.length > 0 && <span className="w-px h-5 bg-border shrink-0 mx-0.5" />}
          {topStyles.map((s) => (
            <FilterPill key={s} active={selectedStyles.includes(s)} onClick={() => toggleStyle(s)}>{s}</FilterPill>
          ))}
        </div>

        {/* Panel "Más filtros": popover en desktop, hoja inferior en mobile */}
        {moreFiltersOpen && (
          <>
            <div onClick={() => setMoreFiltersOpen(false)} className="fixed inset-0 z-30 bg-black/30" />
            <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl lg:absolute lg:inset-auto lg:bottom-auto lg:top-full lg:right-0 lg:mt-2 lg:w-[400px] lg:rounded-2xl lg:border lg:p-5 lg:max-h-[70vh] lg:overflow-y-auto">
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
          {search && <Chip className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => setSearch('')}>&quot;{search}&quot; ✕</Chip>}
          {continent !== 'all' && <Chip className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => setContinent('all')}>{continent} ✕</Chip>}
          {selectedStyles.map((s) => <Chip key={s} className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => toggleStyle(s)}>{s} ✕</Chip>)}
          {selectedClimates.map((c) => <Chip key={c} className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => toggleClimate(c)}>{c} ✕</Chip>)}
          {(minBudget || maxBudget) && <Chip className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => { setMinBudget(''); setMaxBudget(''); }}>Presupuesto ✕</Chip>}
          {onlyPopular && <Chip className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => setOnlyPopular(false)}>Populares ✕</Chip>}
          {onlySafe && <Chip className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 text-xs cursor-pointer h-6" onClick={() => setOnlySafe(false)}>Alta seguridad ✕</Chip>}
        </div>
      )}

      {!loading && (
        <p className="text-sm text-muted font-medium mb-4">
          {filteredDestinations.length} destino{filteredDestinations.length !== 1 ? 's' : ''} disponible{filteredDestinations.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <DestinationCardSkeleton key={i} />)}
        </div>
      ) : visibleDestinations.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-3 text-center rounded-2xl border border-dashed border-border">
          <p className="text-lg font-bold text-foreground">Sin resultados</p>
          <p className="text-sm text-muted">Prueba con otros filtros o amplía la búsqueda.</p>
          <Button className="bg-brand-secondary text-brand-secondary-foreground px-6 mt-1" onClick={resetFilters}>Limpiar filtros</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleDestinations.map((dest) => <DestinationCard key={dest.id} destination={dest} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-8">
          <button onClick={() => { if (safePage > 1) setPage((p) => p - 1); }} disabled={safePage === 1}
            className="h-9 w-9 rounded-lg border border-border text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">‹</button>
          {getVisiblePages(safePage, totalPages).map((entry, idx) =>
            entry === '…' ? (
              <span key={`e-${idx}`} className="h-9 w-9 flex items-center justify-center text-muted text-sm">…</span>
            ) : (
              <button key={entry} onClick={() => setPage(entry)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${entry === safePage ? 'bg-brand-secondary text-brand-secondary-foreground' : 'border border-border hover:bg-surface-secondary'}`}>
                {entry}
              </button>
            )
          )}
          <button onClick={() => { if (safePage < totalPages) setPage((p) => p + 1); }} disabled={safePage === totalPages}
            className="h-9 w-9 rounded-lg border border-border text-sm flex items-center justify-center disabled:opacity-40 hover:bg-surface-secondary transition-colors">›</button>
        </div>
      )}
    </div>
  );
}

function DestinationCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden border border-border bg-surface animate-pulse">
      <div className="h-52 bg-surface-secondary" />
      <div className="px-[18px] pt-3.5 pb-[18px]">
        <div className="flex gap-1.5 mb-2.5">
          <div className="h-4 w-14 rounded-full bg-surface-secondary" />
          <div className="h-4 w-16 rounded-full bg-surface-secondary" />
        </div>
        <div className="h-3.5 w-4/5 rounded bg-surface-secondary mb-4" />
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="h-5 w-20 rounded bg-surface-secondary" />
          <div className="h-9 w-9 rounded-full bg-surface-secondary" />
        </div>
      </div>
    </div>
  );
}
