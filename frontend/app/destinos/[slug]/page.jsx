import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LuCalendarDays, LuGlobe, LuLandmark, LuShieldCheck, LuWallet } from 'react-icons/lu';
import offers from '@/mocks/mock_offers_varied.json';
import destinations from '@/mocks/mock_destinations_informative.json';
import { formatCurrency } from '@/util/utils';
import { Button } from '@heroui/react';
import Footer from '@/components/inicio/sections/Footer';

function getDestination(slug) {
  return destinations.find((item) => item.slug === slug);
}

function getRelatedCities(destination) {
  return destinations
    .filter((item) => item.slug !== destination.slug && item.continent === destination.continent)
    .slice(0, 4);
}

function getRelatedOffers(destination) {
  const byCountry = offers.filter((offer) => offer.location.country === destination.country);
  if (byCountry.length > 0) return byCountry.slice(0, 3);
  return offers.filter((offer) => offer.isFeatured).slice(0, 3);
}

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const destination = getDestination(slug);

  if (!destination) {
    return { title: 'Destino no encontrado | Joanluna Viajes' };
  }

  return {
    title: destination.seo?.metaTitle || `${destination.name} | Joanluna Viajes`,
    description: destination.seo?.metaDescription || destination.shortDescription,
  };
}

export default async function DestinationDetailPage({ params }) {
  const { slug } = await params;
  const destination = getDestination(slug);

  if (!destination) {
    notFound();
  }

  const relatedCities = getRelatedCities(destination);
  const relatedOffers = getRelatedOffers(destination);

  return (
    <div className='space-y-14 pb-12 overflow-x-hidden'>
      <section className='relative rounded-3xl overflow-hidden min-h-[480px]'>
        <Image src={destination.featuredImage} alt={destination.name} fill className='object-cover' priority />
        <div className='absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/65' />

        <div className='absolute inset-x-0 bottom-0 p-8 md:p-12 text-white'>
          <p className='inline-flex items-center rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold mb-4'>
            Destination Focus
          </p>
          <h1 className='text-6xl md:text-7xl font-bold tracking-tight drop-shadow-sm'>{destination.name}</h1>
          <p className='mt-4 max-w-2xl text-lg text-white/90'>{destination.description}</p>
        </div>
      </section>

      <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <InfoCard
          icon={<LuWallet className='text-accent' />}
          title='Moneda'
          value={destination.travelInfo.currency}
          subtitle={destination.country}
        />
        <InfoCard
          icon={<LuGlobe className='text-accent' />}
          title='Idioma'
          value={destination.travelInfo.language}
          subtitle='Uso frecuente en turismo'
        />
        <InfoCard
          icon={<LuCalendarDays className='text-accent' />}
          title='Mejor epoca'
          value={destination.climate.bestMonthsToVisit.slice(0, 2).join(' - ')}
          subtitle={destination.climate.type}
        />
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
        <div className='relative min-h-[360px] rounded-2xl overflow-hidden'>
          <Image
            src={destination.gallery?.[0] || destination.featuredImage}
            alt={`Vista de ${destination.name}`}
            fill
            className='object-cover'
          />
        </div>
        <article className='space-y-4'>
          <p className='text-xs uppercase tracking-[0.2em] text-accent font-semibold'>About the Region</p>
          <h2 className='text-4xl font-bold leading-tight'>
            {destination.name}, una experiencia pensada para descubrir {destination.country}
          </h2>
          <p className='text-muted leading-relaxed'>{destination.description}</p>
          <p className='text-muted leading-relaxed'>
            Aeropuerto principal {destination.travelInfo.airport}. Estadia recomendada: {destination.travelInfo.recommendedStayDays} dias.
            Seguridad estimada {destination.stats.safetyIndex}/100 y presupuesto medio diario de USD {destination.stats.averageDailyBudgetUSD}.
          </p>
          <Link
            href='/ofertas'
            className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-semibold'
          >
            Ver experiencias
          </Link>
        </article>
      </section>

      <section className='space-y-4'>
        <div>
          <h2 className='text-4xl font-bold'>Ciudades populares</h2>
          <p className='text-muted'>Destinos relacionados dentro de {destination.continent}.</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
          {relatedCities.map((city) => (
            <Link key={city.id} href={`/destinos/${city.slug}`} className='group'>
              <article className='relative h-64 rounded-2xl overflow-hidden border border-default'>
                <Image src={city.featuredImage} alt={city.name} fill className='object-cover group-hover:scale-105 transition-transform duration-300' />
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 to-transparent' />
                <div className='absolute bottom-4 left-4 right-4 text-white'>
                  <p className='text-2xl font-bold'>{city.name}</p>
                  <p className='text-sm text-white/85'>{city.country}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className='space-y-6'>
        <div className='text-center space-y-2'>
          <p className='text-xs uppercase tracking-[0.2em] text-accent font-semibold'>Curated experiences</p>
          <h2 className='text-5xl font-bold'>Aventuras disponibles</h2>
          <p className='text-muted'>Paquetes seleccionados para viajar a {destination.country}.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {relatedOffers.map((offer) => {
            const cover = offer.images.find((img) => img.isCover) || offer.images[0];
            const price = getOfferPrice(offer);

            return (
              <article key={offer.id} className='bg-surface rounded-2xl border border-default overflow-hidden flex flex-col h-full'>
                <div className='relative h-52'>
                  <Image src={cover.url} alt={offer.title} fill className='object-cover' />
                  <span className='absolute top-3 right-3 bg-white/90 text-slate-900 text-xs px-2 py-1 rounded-md'>
                    {offer.duration.days} dias
                  </span>
                </div>

                <div className='p-4 space-y-3 flex flex-col grow'>
                  <h3 className='text-2xl font-bold'>{offer.title}</h3>
                  <p className='text-muted line-clamp-2'>{offer.subtitle}</p>

                  <div className='mt-auto pt-3 border-t border-default flex items-end justify-between gap-3'>
                    <div>
                      <p className='text-sm text-muted'>Desde</p>
                      <p className='text-3xl font-bold text-accent'>
                        {formatCurrency({ amount: price, currency: offer.pricing.currency })}
                      </p>
                    </div>
                    <Link
                      href={`/ofertas/${offer.slug}`}
                      className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-slate-900 text-white'
                    >
                      Ver oferta
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function InfoCard({ icon, title, value, subtitle }) {
  return (
    <article className='rounded-2xl border border-default bg-surface p-5'>
      <div className='flex items-start gap-3'>
        <span className='mt-1'>{icon}</span>
        <div>
          <p className='text-xs uppercase tracking-wide text-muted'>{title}</p>
          <p className='text-xl font-bold'>{value}</p>
          <p className='text-sm text-muted'>{subtitle}</p>
        </div>
      </div>
    </article>
  );
}
