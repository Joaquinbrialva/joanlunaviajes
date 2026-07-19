import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LuGlobe, LuMapPin, LuWallet } from 'react-icons/lu';
import { formatCurrency } from '@/util/utils';
import { fetchDestination, fetchDestinations, fetchOffers } from '@/lib/api';

function getOfferPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || null;
}

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const destination = await fetchDestination(slug);

  if (!destination) {
    return { title: 'Destino no encontrado | Joanluna Viajes' };
  }

  return {
    title: destination.seo?.metaTitle || destination.name,
    description: destination.seo?.metaDescription || destination.shortDescription,
    openGraph: {
      title: destination.seo?.metaTitle || destination.name,
      description: destination.seo?.metaDescription || destination.shortDescription,
      images: destination.featuredImage ? [{ url: destination.featuredImage }] : [],
      type: 'website',
    },
    alternates: { canonical: `/destinos/${slug}` },
  };
}

export default async function DestinationDetailPage({ params }) {
  const { slug } = await params;

  const [destination, allDestinations, allOffers] = await Promise.all([
    fetchDestination(slug),
    fetchDestinations(),
    fetchOffers(),
  ]);

  if (!destination) {
    notFound();
  }

  const relatedCities = allDestinations
    .filter((item) => item.slug !== destination.slug && item.continent === destination.continent)
    .slice(0, 4);

  const byCountry = allOffers.filter(
    (o) => normalize(o.location.country) === normalize(destination.country)
  );
  const relatedOffers = byCountry.length > 0
    ? byCountry.slice(0, 3)
    : allOffers.slice(0, 3);

  return (
    <div className='space-y-14 pb-12'>
      <section className='relative rounded-3xl overflow-hidden min-h-[480px]'>
        <Image src={destination.featuredImage} alt={destination.name} fill className='object-cover' priority />
        <div className='absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/65' />

        <div className='absolute inset-x-0 bottom-0 p-8 md:p-12 text-white'>
          <p className='inline-flex items-center gap-1.5 rounded-full bg-brand-secondary/90 backdrop-blur px-3 py-1 text-xs font-semibold mb-4'>
            <LuGlobe size={12} /> {destination.continent}
          </p>
          <h1 className='text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm'>{destination.name}</h1>
          <p className='mt-4 max-w-2xl text-lg text-white/90'>{destination.description}</p>
        </div>
      </section>

      <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <InfoCard
          icon={<LuWallet className='text-brand-secondary' />}
          title='Moneda'
          value={destination.travelInfo.currency}
          subtitle={destination.country}
        />
        <InfoCard
          icon={<LuGlobe className='text-brand-secondary' />}
          title='Idioma'
          value={destination.travelInfo.language}
          subtitle='Uso frecuente en turismo'
        />
        <InfoCard
          icon={<LuMapPin className='text-brand-secondary' />}
          title='Mejor época'
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
          <h2 className='text-3xl md:text-4xl font-extrabold leading-tight tracking-tight'>
            {destination.name}, una experiencia pensada para descubrir {destination.country}
          </h2>
          <p className='text-muted leading-relaxed'>{destination.description}</p>
          <p className='text-muted leading-relaxed'>
            Aeropuerto principal {destination.travelInfo.airport}. Estadía recomendada: {destination.travelInfo.recommendedStayDays} días.
            Seguridad estimada {destination.stats.safetyIndex}/100 y presupuesto medio diario de USD {destination.stats.averageDailyBudgetUSD}.
          </p>
          <Link
            href='/ofertas'
            className='inline-flex items-center justify-center h-11 px-5 rounded-xl bg-brand-secondary text-brand-secondary-foreground font-semibold cursor-pointer hover:opacity-90 transition-opacity'
          >
            Ver experiencias
          </Link>
        </article>
      </section>

      {relatedCities.length > 0 && (
        <section className='space-y-4'>
          <div>
            <h2 className='text-3xl md:text-4xl font-extrabold tracking-tight'>Ciudades populares</h2>
            <p className='text-muted mt-2'>Destinos relacionados dentro de {destination.continent}.</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {relatedCities.map((city) => (
              <Link key={city.id} href={`/destinos/${city.slug}`} className='group cursor-pointer'>
                <article className='relative h-64 rounded-2xl overflow-hidden border border-border'>
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
      )}

      <section className='space-y-6'>
        <div>
          <h2 className='text-3xl md:text-4xl font-extrabold tracking-tight'>Aventuras disponibles</h2>
          <p className='text-muted mt-2'>Paquetes seleccionados para viajar a {destination.country}.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {relatedOffers.map((offer) => {
            const cover = offer.images.find((img) => img.isCover) || offer.images[0];
            const price = getOfferPrice(offer);

            return (
              <article key={offer.id} className='bg-surface rounded-2xl border border-border overflow-hidden flex flex-col h-full'>
                <div className='relative h-52'>
                  <Image src={cover.url} alt={offer.title} fill className='object-cover' />
                  <span className='absolute top-3 right-3 bg-white/90 text-slate-900 text-xs px-2 py-1 rounded-full font-semibold'>
                    {offer.duration.days} días
                  </span>
                </div>

                <div className='p-4 space-y-3 flex flex-col grow'>
                  <h3 className='text-xl font-bold'>{offer.title}</h3>
                  <p className='text-muted line-clamp-2 text-sm'>{offer.subtitle}</p>

                  <div className='mt-auto pt-3 border-t border-border flex items-end justify-between gap-3'>
                    <div>
                      {price ? (
                        <>
                          <p className='text-sm text-muted'>Desde</p>
                          <p className='text-2xl font-bold text-brand-primary'>
                            {formatCurrency({ amount: price, currency: offer.pricing.currency })}
                          </p>
                        </>
                      ) : (
                        <p className='text-lg font-semibold text-muted italic'>Consultar precio</p>
                      )}
                    </div>
                    <Link
                      href={`/ofertas/${offer.slug}`}
                      className='inline-flex items-center justify-center h-10 px-4 rounded-full bg-brand-primary text-brand-primary-foreground font-semibold text-sm transition-opacity hover:opacity-90 cursor-pointer'
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

    </div>
  );
}

function InfoCard({ icon, title, value, subtitle }) {
  return (
    <article className='rounded-2xl border border-border bg-surface p-5'>
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
