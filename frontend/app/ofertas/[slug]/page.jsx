import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Accordion,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Card,
  CardContent,
} from '@heroui/react';
import { FaCheckCircle, FaRegClock, FaRegStar } from 'react-icons/fa';
import { LuMapPin } from 'react-icons/lu';
import { fetchOffer } from '@/lib/api';
import QuoteForm from '@/components/inicio/ui/QuoteForm';

const itineraryTitles = [
  'Llegada y bienvenida',
  'Excursion principal',
  'Dia libre para explorar',
  'Aventura en naturaleza',
  'Experiencia gastronomica',
  'Cierre del viaje y regreso',
];

function buildGallery(offer) {
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const base = cover?.url || `https://picsum.photos/seed/${offer.slug}-cover/1400/900`;

  return [
    { src: base, alt: cover?.alt || `Vista de ${offer.location.city}` },
    { src: `https://picsum.photos/seed/${offer.slug}-a/900/900`, alt: `${offer.location.city} 1` },
    { src: `https://picsum.photos/seed/${offer.slug}-b/900/900`, alt: `${offer.location.city} 2` },
    { src: `https://picsum.photos/seed/${offer.slug}-c/900/900`, alt: `${offer.location.city} 3` },
    { src: `https://picsum.photos/seed/${offer.slug}-d/900/900`, alt: `${offer.location.city} 4` },
  ];
}

function buildItinerary(offer) {
  const days = Math.min(offer.duration?.days || 6, 6);
  return Array.from({ length: days }).map((_, index) => ({
    day: index + 1,
    title: itineraryTitles[index] || `Experiencia del dia ${index + 1}`,
    description: `Jornada pensada para disfrutar ${offer.location.city} con acompanamiento del equipo local, actividades curadas y tiempos de descanso equilibrados.`,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);

  if (!offer) {
    return { title: 'Oferta no encontrada | Joanluna Viajes' };
  }

  return {
    title: `${offer.title} | Joanluna Viajes`,
    description: offer.subtitle,
  };
}

export default async function OfferDetailPage({ params }) {
  const { slug } = await params;
  const offer = await fetchOffer(slug);

  if (!offer) {
    notFound();
  }

  const gallery = buildGallery(offer);
  const itinerary = buildItinerary(offer);

  return (
    <div className='space-y-12'>
      <section className='space-y-6'>
        <Breadcrumbs size='sm' className='text-muted'>
          <BreadcrumbsItem href='/'>Inicio</BreadcrumbsItem>
          <BreadcrumbsItem href='/ofertas'>Ofertas</BreadcrumbsItem>
          <BreadcrumbsItem>{offer.title}</BreadcrumbsItem>
        </Breadcrumbs>

        <div className='space-y-4'>
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>{offer.title}</h1>
          <div className='flex flex-wrap items-center gap-5 text-sm text-muted'>
            <div className='inline-flex items-center gap-1.5'>
              <LuMapPin className='text-accent' />
              <span>{offer.location.city}, {offer.location.country}</span>
            </div>
            <div className='inline-flex items-center gap-1.5'>
              <FaRegClock className='text-accent' />
              <span>{offer.duration.days} dias / {offer.duration.nights} noches</span>
            </div>
            <div className='inline-flex items-center gap-1.5'>
              <FaRegStar className='text-accent' />
              <span>{offer.rating.value} ({offer.rating.reviewsCount} opiniones)</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <div className='lg:col-span-2 lg:row-span-2 relative min-h-105 rounded-2xl overflow-hidden'>
            <Image src={gallery[0].src} alt={gallery[0].alt} fill className='object-cover' />
            {offer.isFeatured && (
              <span className='absolute top-4 left-4 text-xs font-semibold bg-white/95 px-3 py-1 rounded-full'>MÁS VENDIDA</span>
            )}
          </div>

          {gallery.slice(1).map((image, index) => (
            <div key={image.src} className='relative min-h-50 rounded-2xl overflow-hidden'>
              <Image src={image.src} alt={image.alt} fill className='object-cover' />
              {index === 3 && (
                <Button
                  size='sm'
                  className='absolute bottom-3 right-3 text-sm bg-white/90 text-slate-900 rounded-lg cursor-pointer'
                >
                  Ver todas las fotos
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className='grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start'>
        <div className='space-y-8'>
          <article className='space-y-4'>
            <h2 className='text-3xl font-semibold'>Sobre la experiencia</h2>
            <p className='text-muted leading-relaxed'>{offer.subtitle}</p>
            <p className='text-muted leading-relaxed'>
              Disenada para viajeros que valoran el equilibrio entre confort y aventura, esta propuesta incluye hoteleria seleccionada,
              coordinacion local y traslados internos para una experiencia fluida de punta a punta.
            </p>
          </article>

          <article className='space-y-4'>
            <h2 className='text-3xl font-semibold'>Que incluye</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Card className='border border-default bg-surface' shadow='none'>
                <CardContent className='p-5'>
                  <h3 className='font-semibold mb-3 flex items-center gap-2 text-emerald-600'>
                    <FaCheckCircle /> Incluido
                  </h3>
                  <ul className='space-y-2 text-sm text-muted'>
                    {offer.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className='border border-default bg-surface' shadow='none'>
                <CardContent className='p-5'>
                  <h3 className='font-semibold mb-3 text-slate-500'>No incluido</h3>
                  <ul className='space-y-2 text-sm text-muted'>
                    {offer.notIncludes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </article>

          <article className='space-y-4'>
            <h2 className='text-3xl font-semibold'>Itinerario diario</h2>
            <Accordion
              selectionMode='single'
              variant='splitted'
              defaultExpandedKeys={['1']}
              className='p-0'
              itemClasses={{
                base: 'bg-surface border border-default rounded-2xl',
                trigger: 'px-4 py-3',
                content: 'px-4 pb-4',
              }}
            >
              {itinerary.map((item) => (
                <Accordion.Item key={String(item.day)} id={String(item.day)}>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      <div className='flex items-center gap-3'>
                        <span className='text-xs font-semibold bg-accent text-white px-2 py-1 rounded-md'>
                          Dia {item.day}
                        </span>
                        <span className='font-medium'>{item.title}</span>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      <p className='text-sm text-muted leading-relaxed'>{item.description}</p>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </article>

        </div>

        <QuoteForm offer={offer} />
      </section>

    </div>
  );
}
