import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  Card,
  CardContent,
} from '@heroui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { LuMapPin, LuClock, LuPlane } from 'react-icons/lu';
import { fetchOffer } from '@/lib/api';
import QuoteForm from '@/components/inicio/ui/QuoteForm';

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

  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const galleryImages = offer.images?.filter((img) => !img.isCover) || [];

  return (
    <div className='space-y-12 pb-16 md:pb-24'>
      <section className='space-y-6'>
        <Breadcrumbs size='sm' className='text-muted'>
          <BreadcrumbsItem href='/'>Inicio</BreadcrumbsItem>
          <BreadcrumbsItem href='/ofertas'>Ofertas</BreadcrumbsItem>
          <BreadcrumbsItem>{offer.title}</BreadcrumbsItem>
        </Breadcrumbs>

        <div className='space-y-4'>
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>{offer.title}</h1>
          <div className='flex flex-wrap items-center gap-5 text-sm text-muted'>
            {(offer.location?.city || offer.location?.country) && (
              <div className='inline-flex items-center gap-1.5'>
                <LuMapPin className='text-accent' />
                <span>
                  {offer.location.city}
                  {offer.location.city && offer.location.country ? ', ' : ''}
                  {offer.location.country}
                </span>
              </div>
            )}
            {offer.duration?.days > 0 && (
              <div className='inline-flex items-center gap-1.5'>
                <LuClock className='text-accent' />
                <span>{offer.duration.days} días / {offer.duration.nights} noches</span>
              </div>
            )}
            {offer.airline?.name && (
              <div className='inline-flex items-center gap-1.5'>
                <LuPlane className='text-accent' />
                <span>{offer.airline.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gallery — real images only */}
        {cover && (
          <div className={`grid gap-4 ${galleryImages.length > 0 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <div className={`relative rounded-2xl overflow-hidden ${galleryImages.length > 0 ? 'lg:col-span-2 min-h-[340px]' : 'min-h-[400px]'}`}>
              <Image src={cover.url} alt={cover.alt || offer.title} fill className='object-cover' priority />
              {offer.isFeatured && (
                <span className='absolute top-4 left-4 text-xs font-semibold bg-white/95 px-3 py-1 rounded-full'>
                  MÁS VENDIDA
                </span>
              )}
            </div>

            {galleryImages.length > 0 && (
              <div className={`grid gap-4 ${galleryImages.length === 1 ? 'grid-rows-1' : 'grid-rows-2'}`}>
                {galleryImages.slice(0, 4).map((img) => (
                  <div key={img.id} className='relative rounded-2xl overflow-hidden min-h-[160px]'>
                    <Image src={img.url} alt={img.alt || offer.title} fill className='object-cover' />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className='grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start'>
        <div className='space-y-8'>
          {offer.subtitle && (
            <article className='space-y-4'>
              <h2 className='text-3xl font-semibold'>Sobre la experiencia</h2>
              <p className='text-muted leading-relaxed'>{offer.subtitle}</p>
            </article>
          )}

          {(offer.includes?.length > 0 || offer.notIncludes?.length > 0) && (
            <article className='space-y-4'>
              <h2 className='text-3xl font-semibold'>Qué incluye</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {offer.includes?.length > 0 && (
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
                )}
                {offer.notIncludes?.length > 0 && (
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
                )}
              </div>
            </article>
          )}
        </div>

        <QuoteForm offer={offer} />
      </section>
    </div>
  );
}
