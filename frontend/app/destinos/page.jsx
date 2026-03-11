'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Chip, Spinner } from '@heroui/react';
import { LuGlobe, LuMapPin, LuSearch, LuSlidersHorizontal, LuX } from 'react-icons/lu';
import Footer from '@/components/inicio/sections/Footer';
import HeroSelect from '@/components/ui/hero-select';

const ITEMS_PER_PAGE = 9;

// Los travelStyles pueden venir como ["Cultural,Histórico"] — normalizamos
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

export default function DestinationsPage() {
  const [destinationsData, setDestinationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('all');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedClimates, setSelectedClimates] = useState([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlySafe, setOnlySafe] = useState(false); // safetyIndex >= 70
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/destinos', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => { if (active && Array.isArray(data)) setDestinationsData(data); })
      .catch(() => { if (active) setDestinationsData([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

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

  const parsedMinBudget = minBudget !== '' ? Number(minBudget) : 0;
  const parsedMaxBudget = maxBudget !== '' ? Number(maxBudget) : Infinity;

  const hasActiveFilters =
    search !== '' || continent !== 'all' || selectedStyles.length > 0 ||
    selectedClimates.length > 0 ||
    minBudget !== '' || maxBudget !== '' || onlyPopular || onlySafe;

  const activeFilterCount =
    (search ? 1 : 0) +
    (continent !== 'all' ? 1 : 0) +
    selectedStyles.length +
    selectedClimates.length +
    (minBudget || maxBudget ? 1 : 0) +
    (onlyPopular ? 1 : 0) +
    (onlySafe ? 1 : 0);

  const filteredDestinations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let next = destinationsData.filter((d) => {
      const searchMatch =
        q.length === 0 ||
        d.name?.toLowerCase().includes(q) ||
        d.country?.toLowerCase().includes(q) ||
        d.shortDescription?.toLowerCase().includes(q) ||
        d.continent?.toLowerCase().includes(q) ||
        normalizeStyles(d.travelStyles).some((s) => s.toLowerCase().includes(q));

      const contMatch = continent === 'all' || d.continent === continent;

      const stylesMatch =
        selectedStyles.length === 0 ||
        selectedStyles.every((s) => normalizeStyles(d.travelStyles).includes(s));

      const climateMatch =
        selectedClimates.length === 0 || selectedClimates.includes(d.climate?.type);

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
    setSearch('');
    setContinent('all');
    setSelectedStyles([]);
    setSelectedClimates([]);
    setMinBudget('');
    setMaxBudget('');
    setOnlyPopular(false);
    setOnlySafe(false);
    setPage(1);
  }

  function toggleStyle(s) {
    setPage(1);
    setSelectedStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleClimate(c) {
    setPage(1);
    setSelectedClimates((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  const PillBtn = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`h-7 px-3 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default text-muted hover:border-accent/40 hover:text-foreground'
        }`}
    >
      {children}
    </button>
  );

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

      {/* Continente */}
      {continents.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Continente</p>
          <div className='flex flex-wrap gap-1.5'>
            <PillBtn active={continent === 'all'} onClick={() => { setContinent('all'); setPage(1); }}>Todos</PillBtn>
            {continents.map((c) => (
              <PillBtn key={c} active={continent === c} onClick={() => { setContinent(c); setPage(1); }}>{c}</PillBtn>
            ))}
          </div>
        </div>
      )}

      {/* Estilo de viaje */}
      {allStyles.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Estilo de viaje</p>
          <div className='flex flex-wrap gap-1.5'>
            {allStyles.map((s) => (
              <PillBtn key={s} active={selectedStyles.includes(s)} onClick={() => toggleStyle(s)}>{s}</PillBtn>
            ))}
          </div>
        </div>
      )}

      {/* Tipo de clima */}
      {allClimates.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Clima</p>
          <div className='flex flex-wrap gap-1.5'>
            {allClimates.map((c) => (
              <PillBtn key={c} active={selectedClimates.includes(c)} onClick={() => toggleClimate(c)}>{c}</PillBtn>
            ))}
          </div>
        </div>
      )}

      {/* Presupuesto diario */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Presupuesto diario (USD)</p>
        <div className='flex items-center gap-1.5'>
          <input
            type='number'
            placeholder='Desde'
            value={minBudget}
            onChange={(e) => { setMinBudget(e.target.value); setPage(1); }}
            className='w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent'
          />
          <span className='text-muted text-xs shrink-0'>–</span>
          <input
            type='number'
            placeholder='Hasta'
            value={maxBudget}
            onChange={(e) => { setMaxBudget(e.target.value); setPage(1); }}
            className='w-0 flex-1 h-8 px-2 rounded-lg border border-default bg-surface-secondary text-xs focus:outline-none focus:ring-1 focus:ring-accent'
          />
        </div>
      </div>

      {/* Opciones rápidas */}
      <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Opciones</p>
        <div className='flex flex-wrap gap-1.5'>
          <PillBtn active={onlyPopular} onClick={() => { setOnlyPopular((v) => !v); setPage(1); }}>Populares</PillBtn>
          <PillBtn active={onlySafe} onClick={() => { setOnlySafe((v) => !v); setPage(1); }}>Alta seguridad</PillBtn>
        </div>
      </div>

      {/* Destino recomendado */}
      {featuredDestination && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted'>Destino recomendado</p>
          <Link href={`/destinos/${featuredDestination.slug}`} className='group block'>
            <div className='relative rounded-xl overflow-hidden h-36'>
              <Image
                src={featuredDestination.featuredImage || `https://picsum.photos/seed/${featuredDestination.slug}/500/300`}
                alt={featuredDestination.name}
                fill
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-0 bg-linear-to-t from-black/75 to-black/10 p-3 flex flex-col justify-end'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-orange-200 mb-1'>Recomendado</span>
                <p className='text-white font-bold text-sm leading-tight'>{featuredDestination.name}, {featuredDestination.country}</p>
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

          <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold tracking-tight'>Todos los destinos</h1>
              <p className='text-sm text-muted font-medium'>
                {loading ? 'Cargando...' : `${filteredDestinations.length} destino${filteredDestinations.length !== 1 ? 's' : ''} disponible${filteredDestinations.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className='shrink-0'>
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
                triggerClassName='h-10 rounded-xl border border-default bg-surface px-4 text-sm w-44 shadow-sm'
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <LuSearch size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none' />
              <input
                type='text'
                placeholder='Buscar por nombre, país, estilo de viaje...'
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

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className='flex flex-wrap gap-1.5'>
              {search && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setSearch('')}>
                  &ldquo;{search}&rdquo; ✕
                </Chip>
              )}
              {continent !== 'all' && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setContinent('all')}>
                  {continent} ✕
                </Chip>
              )}
              {selectedStyles.map((s) => (
                <Chip key={s} className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => toggleStyle(s)}>
                  {s} ✕
                </Chip>
              ))}
              {selectedClimates.map((c) => (
                <Chip key={c} className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => toggleClimate(c)}>
                  {c} ✕
                </Chip>
              ))}
              {(minBudget || maxBudget) && (
                <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => { setMinBudget(''); setMaxBudget(''); }}>
                  Presupuesto personalizado ✕
                </Chip>
              )}
              {onlyPopular && <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setOnlyPopular(false)}>Populares ✕</Chip>}
              {onlySafe && <Chip className='bg-accent/10 text-accent border border-accent/20 text-xs cursor-pointer h-6' onClick={() => setOnlySafe(false)}>Alta seguridad ✕</Chip>}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className='flex justify-center py-24'><Spinner size='lg' /></div>
          ) : visibleDestinations.length === 0 ? (
            <div className='flex flex-col items-center py-24 gap-3 text-center'>
              <p className='text-lg font-semibold'>Sin resultados</p>
              <p className='text-sm text-muted'>Probá con otros filtros o ampliá la búsqueda.</p>
              <Button className='bg-accent text-white px-6 mt-1' onClick={resetFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'>
              {visibleDestinations.map((dest) => <DestinationCard key={dest.id} destination={dest} />)}
            </div>
          )}

          {/* Paginación */}
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

function DestinationCard({ destination: dest }) {
  const styles = normalizeStyles(dest.travelStyles).slice(0, 3);
  const budget = dest.stats?.averageDailyBudgetUSD;
  const safety = dest.stats?.safetyIndex;

  return (
    <Link
      href={`/destinos/${dest.slug}`}
      className="
        group block rounded-xl border border-default bg-surface
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-lg
      "
    >
      <div className='flex flex-col overflow-hidden rounded-xl border border-default bg-surface'>
        {/* Imagen */}
        <div className='relative h-48 shrink-0 overflow-hidden rounded-t-xl'>
          {dest.featuredImage ? (
            <Image
              src={dest.featuredImage}
              alt={dest.name}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'
              className='rounded-t-xl object-cover transition-transform duration-700 ease-out group-hover:scale-105'
            />
          ) : (
            <div className='h-full w-full rounded-t-xl bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none' />

          {dest.isPopular && (
            <span className='absolute top-2.5 left-2.5 bg-white/90 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full'>
              Popular
            </span>
          )}
          {dest.isFeatured && !dest.isPopular && (
            <span className='absolute top-2.5 left-2.5 bg-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full'>
              Destacado
            </span>
          )}

          <div className='absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white text-xs font-medium drop-shadow'>
            <LuMapPin size={11} className='shrink-0' />
            <span className='truncate max-w-[140px]'>{dest.country}</span>
            <span className='text-white/60'>·</span>
            <LuGlobe size={11} className='shrink-0' />
            <span>{dest.continent}</span>
          </div>
        </div>

        {/* Contenido */}
        <div className='p-4 flex flex-col flex-1'>
          {/* Estilos — altura fija */}
          <div className='flex flex-wrap gap-1 h-5 overflow-hidden mb-2.5'>
            {styles.map((s) => (
              <span key={s} className='text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary text-muted leading-none flex items-center'>
                {s}
              </span>
            ))}
          </div>

          {/* Título — altura fija 2 líneas */}
          <h3 className='font-bold text-sm leading-snug line-clamp-2 h-10 mb-1.5 group-hover:text-accent transition-colors'>
            {dest.name}
          </h3>

          {/* Descripción — 1 línea fija */}
          <p className='text-xs text-muted line-clamp-1 h-4 mb-2'>{dest.shortDescription}</p>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Stats + CTA */}
          <div className='flex items-end justify-between gap-2 pt-3 border-t border-default'>
            <div className='space-y-1'>
              {budget != null && (
                <p className='text-lg font-bold text-accent leading-none'>
                  USD {budget}<span className='text-xs text-muted font-normal'>/día</span>
                </p>
              )}
              <div className='flex items-center gap-2 text-xs text-muted'>
                {safety != null && (
                  <span className='flex items-center gap-0.5'>
                    {safety}/100
                  </span>
                )}
              </div>
            </div>
            <span className='shrink-0 h-8 px-3.5 rounded-lg bg-accent text-white text-xs font-semibold flex items-center transition-opacity group-hover:opacity-90'>
              Ver destino
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
