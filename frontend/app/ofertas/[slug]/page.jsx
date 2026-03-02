import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Accordion,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
} from '@heroui/react';
import { FaCheckCircle, FaRegClock, FaRegStar } from 'react-icons/fa';
import { LuCalendarDays, LuMapPin, LuShieldCheck, LuUsers } from 'react-icons/lu';
import Footer from '@/components/inicio/sections/Footer';
import { readOffers } from '@/lib/mock-store';
import { formatCurrency } from '@/util/utils';

const itineraryTitles = [
  'Llegada y bienvenida',
  'Excursion principal',
  'Dia libre para explorar',
  'Aventura en naturaleza',
  'Experiencia gastronomica',
  'Cierre del viaje y regreso',
];

async function getOffer(slug) {
  const offers = await readOffers();
  return offers.find((item) => item.slug === slug);
}

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

function buildDepartureOptions(offer) {
  const start = new Date(offer.availability.startDate);

  return Array.from({ length: 3 }).map((_, index) => {
    const optionDate = new Date(start);
    optionDate.setDate(start.getDate() + index * 14);
    return optionDate;
  });
}

function formatDate(dateLike) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateLike));
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
  const offer = await getOffer(slug);

  if (!offer) {
    return {
      title: 'Oferta no encontrada | Joanluna Viajes',
    };
  }

  return {
    title: `${offer.title} | Joanluna Viajes`,
    description: offer.subtitle,
  };
}

export default async function OfferDetailPage({ params }) {
  const { slug } = await params;
  const offer = await getOffer(slug);

  if (!offer) {
    notFound();
  }

  const gallery = buildGallery(offer);
  const departureDates = buildDepartureOptions(offer);
  const itinerary = buildItinerary(offer);

  const price = offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
  const travelers = 2;
  const total = price * travelers;

  return (
    <div className='space-y-12 overflow-x-hidden'>
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
                  className='absolute bottom-3 right-3 text-sm bg-white/90 text-slate-900 rounded-lg'
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

          <Card className='border border-default bg-surface' shadow='none'>
            <CardContent className='p-6 space-y-4'>
              <h2 className='text-2xl font-semibold'>Tenes preguntas?</h2>
              <p className='text-sm text-muted'>Nuestro equipo suele responder dentro de 2 horas habiles.</p>

              <form className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Input className='md:col-span-1' placeholder='Nombre completo' />
                <Input className='md:col-span-1' placeholder='Email' type='email' />
                <TextArea
                  className='md:col-span-2'
                  rows={4}
                  placeholder='Contanos que viaje te interesa...'
                />
                <Button className='md:col-span-2 w-fit bg-slate-900 text-white hover:bg-slate-800' type='button'>
                  Enviar consulta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className='xl:sticky xl:top-24 space-y-4'>
          <Card className='border border-default bg-surface' shadow='none'>
            <CardContent className='p-5 space-y-5'>
              <div>
                <p className='text-xs uppercase tracking-wider text-muted mb-1'>Desde</p>
                <p className='text-4xl font-bold text-foreground'>
                  {formatCurrency({ amount: price, currency: offer.pricing.currency })}
                  <span className='text-base font-normal text-muted'> / {offer.pricing.pricePer || 'persona'}</span>
                </p>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='border border-default rounded-xl p-3'>
                  <p className='text-xs text-muted uppercase'>Duracion</p>
                  <p className='font-medium'>{offer.duration.days} dias</p>
                </div>
                <div className='border border-default rounded-xl p-3'>
                  <p className='text-xs text-muted uppercase'>Cupos</p>
                  <p className='font-medium'>Max {offer.availability.remainingSpots}</p>
                </div>
              </div>

              <Select
                className='w-full'
                variant='primary'
                defaultSelectedKeys={[departureDates[0].toISOString()]}
              >
                <Label className='text-sm text-muted inline-flex items-center gap-2'>
                  <LuCalendarDays />
                  Fecha de salida
                </Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {departureDates.map((date) => {
                      const id = date.toISOString();
                      const label = `${formatDate(date)} - Disponible`;
                      return (
                        <ListBox.Item key={id} id={id} textValue={label}>
                          {label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      );
                    })}
                  </ListBox>
                </Select.Popover>
              </Select>

              <label className='flex justify-between'>
                <span className='text-sm text-muted inline-flex items-center gap-2'><LuUsers />Viajeros</span>
                <Input type='number' min='1' defaultValue={String(travelers)} />
              </label>

              <div className='flex items-end justify-between border-t border-default pt-3'>
                <span className='text-muted'>Total estimado</span>
                <strong className='text-xl text-accent'>
                  {formatCurrency({ amount: total, currency: offer.pricing.currency })}
                </strong>
              </div>

              <Button className='w-full bg-accent text-white font-semibold' size='lg'>
                Reservar ahora
              </Button>

              <div className='grid grid-cols-2 gap-2 text-xs text-muted'>
                <p className='inline-flex items-center gap-1'><LuShieldCheck />Reserva segura</p>
                <p className='text-right'>Soporte 24/7</p>
              </div>
            </CardContent>
          </Card>

          <Card className='border border-default bg-surface' shadow='none'>
            <CardContent className='p-4'>
              <p className='text-sm font-semibold'>Necesitas ayuda para reservar?</p>
              <p className='text-sm text-muted'>Llamanos al +54 11 2334-5678</p>
            </CardContent>
          </Card>
        </aside>
      </section>

      <Footer />
    </div>
  );
}
