'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Input, Label, Radio, RadioGroup } from '@heroui/react';
import { FaHeart, FaRegHeart, FaStar } from 'react-icons/fa';
import { LuCalendarDays, LuClock3, LuMapPin, LuSearch } from 'react-icons/lu';
import { formatCurrency } from '@/util/utils';
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
const MIN_PRICE = 100;
const MAX_PRICE = 5000;

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

function renderStars(value) {
  const fullStars = Math.round(value);
  return Array.from({ length: 5 }).map((_, index) => (
    <FaStar
      key={`star-${index}`}
      className={index < fullStars ? 'text-amber-400' : 'text-slate-300'}
      size={14}
    />
  ));
}

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

export default function OffersPage() {
  const [offersData, setOffersData] = useState([]);
  const [sortBy, setSortBy] = useState('price-asc');
  const [durationFilter, setDurationFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    fetch('/api/ofertas', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data)) setOffersData(data);
      })
      .catch(() => {
        if (active) setOffersData([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const destinationStats = useMemo(() => {
    const map = new Map();
    for (const offer of offersData) {
      const key = offer.location.country;
      map.set(key, (map.get(key) || 0) + 1);
    }

    return [...map.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [offersData]);

  const [selectedDestinations, setSelectedDestinations] = useState([]);

  const filteredOffers = useMemo(() => {
    let next = offersData.filter((offer) => {
      const price = getOfferPrice(offer);
      const destinationMatch =
        selectedDestinations.length === 0 || selectedDestinations.includes(offer.location.country);
      const durationMatch =
        durationFilter === 'all' || getDurationBucket(offer.duration.days) === durationFilter;

      return (
        price >= priceRange[0] &&
        price <= priceRange[1] &&
        destinationMatch &&
        durationMatch
      );
    });

    next = [...next].sort((a, b) => {
      if (sortBy === 'price-asc') return getOfferPrice(a) - getOfferPrice(b);
      if (sortBy === 'price-desc') return getOfferPrice(b) - getOfferPrice(a);
      if (sortBy === 'rating') return b.rating.value - a.rating.value;
      return 0;
    });

    return next;
  }, [durationFilter, priceRange, selectedDestinations, sortBy, offersData]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleOffers = filteredOffers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setDurationFilter('all');
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSelectedDestinations([]);
    setSortBy('price-asc');
    setPage(1);
  };

  return (
    <div className='space-y-10 pb-8 overflow-x-hidden'>
      <section className='rounded-2xl border border-default bg-surface p-3 md:p-4'>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3'>
          <Input
            placeholder='Origen (ej. Madrid)'
            startContent={<LuSearch className='text-muted' />}
            className='w-full'
          />
          <Input
            placeholder='Destino'
            startContent={<LuMapPin className='text-muted' />}
            className='w-full'
          />
          <Input
            placeholder='15 Jun - 22 Jun'
            startContent={<LuCalendarDays className='text-muted' />}
            className='w-full'
          />
          <Button className='bg-accent text-white font-semibold px-8'>Buscar</Button>
        </div>
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start'>
        <aside className='space-y-7'>
          <div className='flex items-center justify-between border-b border-default pb-3'>
            <h2 className='text-3xl font-bold'>Filtros</h2>
            <Button
              variant='tertiary'
              type='button'
              className='text-accent text-sm font-medium'
              onClick={resetFilters}
            >
              Resetear
            </Button>
          </div>

          <div className='space-y-3'>
            <h3 className='text-xl font-semibold'>Precio</h3>
            <Slider
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={50}
              value={priceRange}
              onValueChange={(value) => {
                const nextMin = value[0] ?? MIN_PRICE;
                const nextMax = value[1] ?? MAX_PRICE;
                setPriceRange([Math.min(nextMin, nextMax), Math.max(nextMin, nextMax)]);
                setPage(1);
              }}
              className='py-2'
            />
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted'>
                {formatCurrency({ amount: MIN_PRICE, currency: 'EUR', locale: 'es-ES' })}
              </span>
              <span className='font-semibold text-accent'>
                {formatCurrency({ amount: priceRange[0], currency: 'EUR', locale: 'es-ES' })} -{' '}
                {formatCurrency({ amount: priceRange[1], currency: 'EUR', locale: 'es-ES' })}
              </span>
              <span className='text-muted'>
                {formatCurrency({ amount: MAX_PRICE, currency: 'EUR', locale: 'es-ES' })}
              </span>
            </div>
          </div>

          <div className='space-y-3'>
            <h3 className='text-xl font-semibold'>Destinos</h3>
            <div className='space-y-2'>
              {destinationStats.map((item) => {
                const checked = selectedDestinations.includes(item.country);
                return (
                  <label key={item.country} className='flex items-center gap-3 text-lg cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={(event) => {
                        setPage(1);
                        if (event.target.checked) {
                          setSelectedDestinations((prev) => [...prev, item.country]);
                          return;
                        }
                        setSelectedDestinations((prev) => prev.filter((country) => country !== item.country));
                      }}
                      className='h-5 w-5 rounded accent-orange-500'
                    />
                    <span>{item.country}</span>
                    <span className='text-muted text-base'>({item.count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className='text-xl font-semibold'>Duración</h3>
            <RadioGroup
              defaultValue="all"
              value={durationFilter}
              onValueChange={(value) => {
                setDurationFilter(value);
                setPage(1);
              }}
              name="duration"
            >
              <Radio value="all">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>Todas</Label>
                </Radio.Content>
              </Radio>
              <Radio value="short">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>1-3 dias</Label>
                </Radio.Content>
              </Radio>
              <Radio value="week">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>1 semana</Label>
                </Radio.Content>
              </Radio>
              <Radio value="long">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>2 semanas+</Label>
                </Radio.Content>
              </Radio>
            </RadioGroup>
          </div>

          <div className='relative rounded-2xl overflow-hidden min-h-60'>
            <Image
              src='https://picsum.photos/seed/ofertaespecial/500/350'
              alt='Oferta especial'
              fill
              className='object-cover'
            />
            <div className='absolute inset-0 bg-linear-to-t from-black/80 to-transparent p-4 flex flex-col justify-end'>
              <p className='text-xs uppercase tracking-[0.2em] text-orange-200'>Oferta especial</p>
              <p className='text-white text-3xl font-bold'>Verano europeo</p>
              <Button size='sm' className='w-fit mt-3 bg-accent text-white'>
                Ver oferta
              </Button>
            </div>
          </div>
        </aside>

        <main className='space-y-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-5xl font-bold tracking-tight'>Resultados para &quot;Europa&quot;</h1>
              <p className='text-muted text-xl mt-1'>{filteredOffers.length} ofertas encontradas</p>
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
                  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
                  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
                  { value: 'rating', label: 'Mejor puntuadas' },
                ]}
                className='min-w-56'
                triggerClassName='h-10 rounded-xl border border-default bg-surface px-4'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {visibleOffers.map((offer) => {
              const price = getOfferPrice(offer);
              const originalPrice = offer.pricing?.originalPrice;
              const discount = offer.pricing?.discountPercentage;
              const cover = offer.images.find((img) => img.isCover) || offer.images[0];

              return (
                <article
                  key={offer.id}
                  className='bg-surface rounded-2xl overflow-hidden border border-default shadow-sm hover:shadow-md transition-shadow h-full flex flex-col'
                >
                  <div className='relative h-56'>
                    <Image src={cover.url} alt={cover.alt || offer.title} fill className='object-cover' />

                    {discount ? (
                      <span className='absolute top-3 left-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-md'>
                        -{discount}% OFF
                      </span>
                    ) : offer.isFeatured ? (
                      <span className='absolute top-3 left-3 bg-slate-900/90 text-white text-xs font-bold px-3 py-1 rounded-md'>
                        Más vendida
                      </span>
                    ) : null}

                    <button
                      type='button'
                      className='absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 text-slate-700 grid place-content-center'
                      aria-label='Favorito'
                    >
                      {offer.isPopular ? <FaHeart /> : <FaRegHeart />}
                    </button>
                  </div>

                  <div className='p-4 space-y-4 flex flex-col grow'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-1'>{renderStars(offer.rating.value)}</div>
                      <p className='inline-flex items-center gap-1 text-muted text-sm'>
                        <LuClock3 /> {offer.duration.days} dias
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <h3 className='text-3xl font-bold leading-tight line-clamp-2 min-h-[4.75rem]'>{offer.title}</h3>
                      <p className='text-muted line-clamp-2 min-h-[3.25rem]'>{offer.subtitle}</p>
                    </div>

                    <div className='border-t border-default pt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-auto'>
                      <div>
                        {originalPrice && originalPrice > price ? (
                          <p className='text-muted line-through text-sm'>
                            {formatCardPrice(originalPrice, offer.pricing.currency)}
                          </p>
                        ) : (
                          <p className='text-sm text-transparent'>placeholder</p>
                        )}
                        <p className='text-3xl font-bold text-accent leading-none'>
                          {formatCardPrice(price, offer.pricing.currency)}
                        </p>
                        <p className='text-sm text-muted'>/persona</p>
                      </div>
                      <Link href={`/ofertas/${offer.slug}`}>
                        <Button
                          className='bg-slate-900 text-white w-full sm:w-auto shrink-0'
                        >
                          Ver detalle
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
