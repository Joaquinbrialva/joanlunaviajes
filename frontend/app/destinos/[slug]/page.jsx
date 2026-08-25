import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, BreadcrumbsItem } from '@heroui/react';
import { LuArrowUpRight, LuPlaneTakeoff } from 'react-icons/lu';
import { fetchDestination, fetchDestinations, fetchOffers } from '@/lib/api';
import OfferCard from '@/components/offer-card';
import DestinationCard from '@/components/destination-card';
import Reveal from '@/components/ui/reveal';

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

function normalizeStyles(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.join(',').split(',').map((s) => s.trim()).filter(Boolean);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const destination = await fetchDestination(slug);

  if (!destination) {
    return { title: 'Destino no encontrado | Joanluna Viajes' };
  }

  return {
    title: destination.seo?.metaTitle || destination.title,
    description: destination.seo?.metaDescription || destination.shortDescription,
    openGraph: {
      title: destination.seo?.metaTitle || destination.title,
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
    .slice(0, 6);

  const byCountry = allOffers.filter(
    (o) => normalize(o.location.country) === normalize(destination.country)
  );
  const relatedOffers = byCountry.length > 0 ? byCountry.slice(0, 3) : allOffers.slice(0, 3);

  const heroText = destination.shortDescription || destination.description;
  const essayText =
    destination.description && destination.description.trim() !== (heroText || '').trim()
      ? destination.description
      : null;

  const highlights = (destination.highlights || []).filter(Boolean);
  const styles = normalizeStyles(destination.travelStyles).slice(0, 3);
  const gallery = (destination.gallery || []).filter((src) => src && src !== destination.featuredImage);

  const bestMonths = destination.climate?.bestMonthsToVisit?.slice(0, 2)?.join(' y ');
  const climateLabel = [destination.climate?.type, destination.climate?.averageTemperatureC != null ? `${destination.climate.averageTemperatureC}°C prom.` : null]
    .filter(Boolean)
    .join(' · ');

  const ficha = [
    destination.travelInfo?.airport && { label: 'Aeropuerto', value: destination.travelInfo.airport },
    destination.travelInfo?.language && { label: 'Idioma', value: destination.travelInfo.language },
    destination.travelInfo?.currency && { label: 'Moneda', value: destination.travelInfo.currency },
    bestMonths && { label: 'Mejor época', value: bestMonths },
    climateLabel && { label: 'Clima', value: climateLabel },
    destination.travelInfo?.recommendedStayDays && { label: 'Estadía ideal', value: `${destination.travelInfo.recommendedStayDays} días` },
    destination.stats?.averageDailyBudgetUSD != null && { label: 'Presupuesto', value: `USD ${destination.stats.averageDailyBudgetUSD}/día` },
    destination.stats?.safetyIndex != null && { label: 'Seguridad', value: `${destination.stats.safetyIndex}/100` },
  ].filter(Boolean);

  return (
    <div className='pb-20 md:pb-28'>

      {/* Breadcrumbs */}
      <div className='pt-6 mb-5'>
        <Breadcrumbs size='sm' className='text-muted'>
          <BreadcrumbsItem href='/'>Inicio</BreadcrumbsItem>
          <BreadcrumbsItem href='/destinos'>Destinos</BreadcrumbsItem>
          <BreadcrumbsItem>{destination.city}</BreadcrumbsItem>
        </Breadcrumbs>
      </div>

      {/* ============ HERO ============ */}
      <section className='relative rounded-[32px] overflow-hidden min-h-[460px] md:min-h-[560px] mb-8'>
        <Image src={destination.featuredImage} alt={destination.city} fill priority className='object-cover' sizes='100vw' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5' />

        <div className='relative flex h-full min-h-[460px] md:min-h-[560px] flex-col justify-end p-6 md:p-12'>
          <div className='flex items-center gap-2 mb-5'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-white text-[#12243b] px-3.5 py-1.5 text-[11px] font-bold'>
              {destination.country}
            </span>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md text-white px-3.5 py-1.5 text-[11px] font-bold'>
              {destination.continent}
            </span>
          </div>

          <div className='flex flex-col md:flex-row md:items-end md:justify-between gap-6'>
            <div className='max-w-2xl min-w-0'>
              <h1
                className='font-extrabold text-white mb-4'
                style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4.5rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
              >
                {destination.title}
              </h1>
              {heroText && <p className='text-base md:text-lg text-white/85 leading-relaxed'>{heroText}</p>}

              {styles.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-5'>
                  {styles.map((s) => (
                    <span key={s} className='text-[11px] font-semibold text-white/90 border border-white/25 rounded-full px-3 py-1'>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={`/#cotizar?destino=${slug}`}
              className='inline-flex items-center justify-center gap-2 h-[52px] shrink-0 px-6 rounded-2xl bg-brand-primary text-brand-primary-foreground font-bold text-[15px] hover:opacity-90 transition-opacity'
            >
              Cotizar este viaje
              <LuArrowUpRight size={18} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FICHA DE VIAJE (boarding-pass strip) ============ */}
      {ficha.length > 0 && (
        <Reveal>
          <section className='relative rounded-[24px] border border-dashed border-border bg-surface px-6 md:px-9 py-6 md:py-7 mb-16'>
            <LuPlaneTakeoff size={20} className='absolute top-6 right-7 text-brand-secondary/25 hidden md:block' />
            <div className='flex flex-wrap gap-x-10 gap-y-5'>
              {ficha.map((f) => (
                <div key={f.label} className='min-w-[110px]'>
                  <p className='text-[10px] font-bold uppercase tracking-[0.08em] text-brand-secondary mb-1'>{f.label}</p>
                  <p className='text-[15px] font-bold text-foreground leading-snug'>{f.value}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* ============ IMPERDIBLES + RELATO ============ */}
      {(highlights.length > 0 || essayText) && (
        <section className={`grid grid-cols-1 gap-10 md:gap-16 mb-16 md:mb-20 ${highlights.length > 0 && essayText ? 'lg:grid-cols-[0.85fr_1.15fr]' : ''}`}>
          {highlights.length > 0 && (
            <Reveal as='div' className={!essayText ? 'max-w-xl' : undefined}>
              <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight mb-6' style={{ letterSpacing: '-0.02em' }}>
                Imperdibles
              </h2>
              <div>
                {highlights.map((item, i) => (
                  <div key={item} className={`flex items-baseline gap-4 py-3.5 ${i === 0 ? '' : 'border-t border-border'}`}>
                    <span className='text-lg font-extrabold text-brand-tertiary tabular-nums shrink-0 w-6'>{String(i + 1).padStart(2, '0')}</span>
                    <span className='text-[15px] md:text-base font-medium text-foreground'>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {essayText && (
            <Reveal as='div' delay={80}>
              <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight mb-6' style={{ letterSpacing: '-0.02em' }}>
                Por qué viajar a {destination.city}
              </h2>
              <p className='text-[16px] md:text-[17px] text-muted leading-[1.7] max-w-[65ch]' style={{ textWrap: 'pretty' }}>
                {essayText}
              </p>
            </Reveal>
          )}
        </section>
      )}

      {/* ============ GALERÍA ============ */}
      {gallery.length > 0 && (
        <section className='mb-16 md:mb-20'>
          <div className='flex overflow-x-auto scrollbar-hide gap-4 snap-x snap-mandatory pb-1 -mx-1 px-1'>
            {gallery.map((src, i) => (
              <Reveal key={src} delay={i * 60} className={`relative shrink-0 rounded-2xl overflow-hidden snap-start ${i % 2 === 0 ? 'w-[240px] md:w-[320px] h-[300px] md:h-[400px]' : 'w-[280px] md:w-[380px] h-[220px] md:h-[280px] self-end'}`}>
                <Image src={src} alt={`${destination.city} — foto ${i + 1}`} fill sizes='(max-width: 768px) 280px, 380px' className='object-cover' />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ CIUDADES RELACIONADAS ============ */}
      {relatedCities.length > 0 && (
        <section className='mb-16 md:mb-20'>
          <div className='flex items-end justify-between gap-4 pb-6 mb-7 border-b border-border'>
            <div>
              <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight' style={{ letterSpacing: '-0.02em' }}>Otros destinos en {destination.continent}</h2>
              <p className='text-sm text-muted mt-1.5'>Para seguir sumando paradas al itinerario.</p>
            </div>
          </div>

          <div className='flex overflow-x-auto scrollbar-hide gap-5 snap-x snap-mandatory pb-1'>
            {relatedCities.map((city, i) => (
              <Reveal key={city.id} delay={i * 60} className='w-[270px] shrink-0 snap-start'>
                <DestinationCard destination={city} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ AVENTURAS DISPONIBLES ============ */}
      <section className='mb-16 md:mb-20'>
        <div className='pb-6 mb-7 border-b border-border'>
          <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight' style={{ letterSpacing: '-0.02em' }}>Aventuras disponibles</h2>
          <p className='text-sm text-muted mt-1.5'>Paquetes seleccionados para viajar a {destination.country}.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {relatedOffers.map((offer, i) => (
            <Reveal key={offer.id} delay={i * 70}>
              <OfferCard offer={offer} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <Reveal>
        <section className='relative overflow-hidden rounded-[32px] bg-brand-primary px-8 md:px-16 py-12 md:py-16 text-center'>
          <svg className='absolute -bottom-10 -left-10 opacity-20 pointer-events-none' width='240' height='240' viewBox='0 0 240 240' fill='none'>
            <circle cx='120' cy='120' r='100' stroke='var(--brand-primary-foreground)' strokeWidth='1.5' />
            <circle cx='120' cy='120' r='70' stroke='var(--brand-primary-foreground)' strokeWidth='1.5' />
          </svg>
          <h2 className='relative font-extrabold text-brand-primary-foreground mb-4' style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)', letterSpacing: '-0.03em' }}>
            ¿Listo para viajar a {destination.city}?
          </h2>
          <p className='relative text-brand-primary-foreground/80 text-base md:text-lg mb-8 max-w-xl mx-auto'>
            Contanos cómo lo imaginás y te armamos una propuesta a medida, sin vueltas.
          </p>
          <Link
            href={`/#cotizar?destino=${slug}`}
            className='relative inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded-2xl bg-brand-primary-foreground text-white font-bold text-[15px] hover:opacity-90 transition-opacity'
          >
            Pedir cotización
            <LuArrowUpRight size={18} strokeWidth={2.5} />
          </Link>
        </section>
      </Reveal>

    </div>
  );
}
