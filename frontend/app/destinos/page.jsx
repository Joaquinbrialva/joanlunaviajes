'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Input } from '@heroui/react';
import { LuGlobe, LuMapPin, LuSearch } from 'react-icons/lu';
import { Slider } from '@/components/ui/slider';
import Footer from '@/components/inicio/sections/Footer';
import HeroSelect from '@/components/ui/hero-select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 6;
const MIN_BUDGET = 40;
const MAX_BUDGET = 260;

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

export default function DestinationsPage() {
  const [destinationsData, setDestinationsData] = useState([]);
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('all');
  const [travelStyle, setTravelStyle] = useState('all');
  const [visaFilter, setVisaFilter] = useState('all');
  const [budgetRange, setBudgetRange] = useState([MIN_BUDGET, MAX_BUDGET]);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    fetch('/api/destinos', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data)) setDestinationsData(data);
      })
      .catch(() => {
        if (active) setDestinationsData([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredDestination = useMemo(
    () => destinationsData.find((item) => item.isFeatured) || destinationsData[0],
    [destinationsData]
  );

  const continents = useMemo(
    () => ['all', ...new Set(destinationsData.map((item) => item.continent))],
    [destinationsData]
  );

  const styles = useMemo(
    () => ['all', ...new Set(destinationsData.flatMap((item) => item.travelStyles))],
    [destinationsData]
  );

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    let next = destinationsData.filter((destination) => {
      const searchMatch =
        query.length === 0 ||
        destination.name.toLowerCase().includes(query) ||
        destination.country.toLowerCase().includes(query) ||
        destination.shortDescription.toLowerCase().includes(query);

      const continentMatch = continent === 'all' || destination.continent === continent;
      const styleMatch =
        travelStyle === 'all' || destination.travelStyles.includes(travelStyle);

      const visaMatch =
        visaFilter === 'all' ||
        (visaFilter === 'required' && destination.travelInfo.visaRequired) ||
        (visaFilter === 'not-required' && !destination.travelInfo.visaRequired);

      const budget = destination.stats.averageDailyBudgetUSD;
      const budgetMatch = budget >= budgetRange[0] && budget <= budgetRange[1];

      return searchMatch && continentMatch && styleMatch && visaMatch && budgetMatch;
    });

    next = [...next].sort((a, b) => {
      if (sortBy === 'popular') return Number(b.isPopular) - Number(a.isPopular);
      if (sortBy === 'budget-asc') return a.stats.averageDailyBudgetUSD - b.stats.averageDailyBudgetUSD;
      if (sortBy === 'budget-desc') return b.stats.averageDailyBudgetUSD - a.stats.averageDailyBudgetUSD;
      if (sortBy === 'safety-desc') return b.stats.safetyIndex - a.stats.safetyIndex;
      return 0;
    });

    return next;
  }, [budgetRange, continent, search, sortBy, travelStyle, visaFilter, destinationsData]);

  const totalPages = Math.max(1, Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleDestinations = filteredDestinations.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearch('');
    setContinent('all');
    setTravelStyle('all');
    setVisaFilter('all');
    setBudgetRange([MIN_BUDGET, MAX_BUDGET]);
    setSortBy('popular');
    setPage(1);
  };

  return (
    <div className='space-y-10 pb-8 overflow-x-hidden'>
      <section className='rounded-2xl border border-default bg-surface p-3 md:p-4'>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_240px_240px_auto] gap-3'>
          <Input
            placeholder='Buscar destino, pais o ciudad...'
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            startContent={<LuSearch className='text-muted' />}
            className='w-full'
          />

          <HeroSelect
            value={continent}
            onValueChange={(value) => {
              setContinent(value);
              setPage(1);
            }}
            options={continents.map((item) => ({
              value: item,
              label: item === 'all' ? 'Todos los continentes' : item,
            }))}
            triggerClassName='h-10 rounded-xl border border-default bg-surface px-4'
          />

          <HeroSelect
            value={travelStyle}
            onValueChange={(value) => {
              setTravelStyle(value);
              setPage(1);
            }}
            options={styles.map((item) => ({
              value: item,
              label: item === 'all' ? 'Todos los estilos' : item,
            }))}
            triggerClassName='h-10 rounded-xl border border-default bg-surface px-4'
          />

          <Button className='bg-accent text-white font-semibold px-8' onClick={() => setPage(1)}>
            Buscar
          </Button>
        </div>
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start'>
        <aside className='space-y-7'>
          <div className='flex items-center justify-between border-b border-default pb-3'>
            <h2 className='text-3xl font-bold'>Filtros</h2>
            <Button variant='tertiary' className='text-accent text-sm font-medium' onClick={resetFilters}>
              Resetear
            </Button>
          </div>

          <div className='space-y-3'>
            <h3 className='text-xl font-semibold'>Presupuesto diario</h3>
            <Slider
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={5}
              value={budgetRange}
              onValueChange={(value) => {
                const nextMin = value[0] ?? MIN_BUDGET;
                const nextMax = value[1] ?? MAX_BUDGET;
                setBudgetRange([Math.min(nextMin, nextMax), Math.max(nextMin, nextMax)]);
                setPage(1);
              }}
              className='py-2'
            />
            <p className='text-sm text-muted'>
              USD {budgetRange[0]} - USD {budgetRange[1]} por dia
            </p>
          </div>

          <div className='space-y-3'>
            <h3 className='text-xl font-semibold'>Visa</h3>
            <div className='space-y-2'>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'not-required', label: 'Sin visa' },
                { value: 'required', label: 'Requiere visa' },
              ].map((item) => (
                <label key={item.value} className='flex items-center gap-3 text-lg cursor-pointer'>
                  <input
                    type='radio'
                    name='visa-filter'
                    checked={visaFilter === item.value}
                    onChange={() => {
                      setVisaFilter(item.value);
                      setPage(1);
                    }}
                    className='accent-orange-500'
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className='relative rounded-2xl overflow-hidden min-h-56'>
            <Image
              src='https://picsum.photos/seed/destino-featured/480/340'
              alt='Destino recomendado'
              fill
              className='object-cover'
            />
            <div className='absolute inset-0 bg-linear-to-t from-black/80 to-transparent p-4 flex flex-col justify-end'>
              <p className='text-xs uppercase tracking-[0.2em] text-orange-200'>Destino recomendado</p>
              <p className='text-white text-2xl font-bold'>Nuevas rutas 2026</p>
              {featuredDestination ? (
                <Link
                  href={`/destinos/${featuredDestination.slug}`}
                  className='inline-flex items-center justify-center h-8 px-3 rounded-md w-fit mt-3 bg-accent text-white text-sm font-medium'
                >
                  Ver destino
                </Link>
              ) : null}
            </div>
          </div>
        </aside>

        <main className='space-y-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-5xl font-bold tracking-tight'>Destinos</h1>
              <p className='text-muted text-xl mt-1'>{filteredDestinations.length} destinos encontrados</p>
            </div>

            <div className='flex items-center gap-3'>
              <span className='text-muted'>Ordenar por:</span>
              <HeroSelect
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
                options={[
                  { value: 'popular', label: 'Más populares' },
                  { value: 'budget-asc', label: 'Presupuesto: Menor a Mayor' },
                  { value: 'budget-desc', label: 'Presupuesto: Mayor a Menor' },
                  { value: 'safety-desc', label: 'Mayor índice de seguridad' },
                ]}
                className='min-w-56'
                triggerClassName='h-10 rounded-xl border border-default bg-surface px-4'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {visibleDestinations.map((destination) => (
              <article
                key={destination.id}
                className='bg-surface rounded-2xl overflow-hidden border border-default shadow-sm hover:shadow-md transition-shadow h-full flex flex-col'
              >
                <div className='relative h-56'>
                  <Image src={destination.featuredImage} alt={destination.name} fill className='object-cover' />
                  {destination.isFeatured && (
                    <span className='absolute top-3 left-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-md'>
                      Destacado
                    </span>
                  )}
                </div>

                <div className='p-4 space-y-4 flex flex-col grow'>
                  <div className='flex items-center justify-between text-sm'>
                    <p className='inline-flex items-center gap-1 text-muted'>
                      <LuMapPin /> {destination.country}
                    </p>
                    <p className='inline-flex items-center gap-1 text-muted'>
                      <LuGlobe /> {destination.continent}
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-3xl font-bold leading-tight line-clamp-2 min-h-[4.75rem]'>
                      {destination.name}
                    </h3>
                    <p className='text-muted line-clamp-2 min-h-[3.25rem]'>
                      {destination.shortDescription}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {destination.travelStyles.slice(0, 3).map((style) => (
                      <span key={style} className='text-xs bg-surface-secondary px-2 py-1 rounded-full text-muted'>
                        {style}
                      </span>
                    ))}
                  </div>

                  <div className='border-t border-default pt-3 mt-auto flex items-end justify-between gap-3'>
                    <div>
                      <p className='text-sm text-muted'>Presupuesto diario</p>
                      <p className='text-2xl font-bold text-accent'>USD {destination.stats.averageDailyBudgetUSD}</p>
                      <p className='text-sm text-muted'>Seguridad {destination.stats.safetyIndex}/100</p>
                    </div>

                    <Link
                      href={`/destinos/${destination.slug}`}
                      className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-slate-900 text-white w-full sm:w-auto shrink-0'
                    >
                      Ver destino
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination className='pt-4'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  onClick={(event) => {
                    event.preventDefault();
                    if (safePage > 1) setPage((prev) => Math.max(1, prev - 1));
                  }}
                  className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {getVisiblePages(safePage, totalPages).map((entry, index) => {
                if (entry === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                const pageNumber = entry;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href='#'
                      isActive={pageNumber === safePage}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href='#'
                  onClick={(event) => {
                    event.preventDefault();
                    if (safePage < totalPages) setPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </main>
      </section>

      <Footer />
    </div>
  );
}
