'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Chip, Spinner } from '@heroui/react';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader } from '@/components/admin/kit';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';
import OfferFormBody from '@/components/admin/offer-form/offer-form';
import OfferPreviewPanel from '@/components/admin/offer-form/preview-panel';
import { FieldShell, validateOfferForm } from '@/components/admin/offer-form/parts';

const initialForm = {
  title: '', tripType: 'round-trip', customRoute: '',
  originCountry: 'Argentina', originCity: '',
  destinationCountry: '', destinationCity: '', destinationAirport: '',
  startDate: '', endDate: '', availableMonths: '', days: 7, nights: 6,
  airline: '', airlineIata: '', flightType: 'direct', layoverCity: '',
  luggagePersonal: true, luggageCarryOn: true, luggageChecked: false,
  currency: 'ARS', price: null, originalPrice: null, priceNote: 'por persona',
  seats: 12, status: 'draft', featured: false, isSpecialOffer: false, summary: '',
  includes: [], notIncludes: [], highlights: [],
  coverImage: '', hotelName: '', galleryImages: [],
  hasHotel: false, hotelStars: 0, hotelAddress: '', hotelPlaceId: '', hotelMapsUrl: '',
};

function offerToForm(offer) {
  const isMulti = offer.location?.country === 'Multi-destino';
  const pricing = offer.pricing || {};
  const avail = offer.availability || {};
  return {
    title: offer.title || '',
    tripType: isMulti ? 'multi' : 'round-trip',
    customRoute: isMulti ? offer.location?.city || '' : '',
    originCountry: offer.origin?.country || 'Argentina',
    originCity: offer.origin?.city || '',
    destinationCountry: isMulti ? '' : offer.location?.country || '',
    destinationCity: isMulti ? '' : offer.location?.city || '',
    destinationAirport: offer.location?.airport !== 'N/A' ? offer.location?.airport || '' : '',
    startDate: avail.startDate ? avail.startDate.split('T')[0] : '',
    endDate: avail.endDate ? avail.endDate.split('T')[0] : '',
    availableMonths: avail.availableMonths || '',
    days: offer.duration?.days || 7,
    nights: offer.duration?.nights || 6,
    airline: offer.airline?.name || '',
    airlineIata: offer.airline?.iata || '',
    flightType: offer.flight?.type || 'direct',
    layoverCity: offer.flight?.layover || '',
    luggagePersonal: offer.luggage?.personal ?? true,
    luggageCarryOn: offer.luggage?.carryOn ?? true,
    luggageChecked: offer.luggage?.checked ?? false,
    currency: pricing.currency || 'ARS',
    price: pricing.price ?? pricing.finalPrice ?? null,
    originalPrice: pricing.originalPrice ?? null,
    priceNote: 'por persona',
    seats: avail.remainingSpots || 12,
    status: offer.status || 'draft',
    featured: offer.isFeatured || false,
    isSpecialOffer: offer.isSpecialOffer ?? false,
    summary: offer.subtitle || '',
    includes: Array.isArray(offer.includes) ? offer.includes : [],
    notIncludes: Array.isArray(offer.notIncludes) ? offer.notIncludes : [],
    highlights: Array.isArray(offer.highlights) ? offer.highlights : [],
    coverImage: offer.images?.find((i) => i.isCover)?.url || '',
    hotelName: offer.hotel?.name || '',
    hasHotel: Boolean(offer.hotel?.name),
    hotelStars: offer.hotel?.stars || 0,
    hotelAddress: offer.hotel?.address || '',
    hotelPlaceId: offer.hotel?.placeId || '',
    hotelMapsUrl: offer.hotel?.mapsUrl || '',
    galleryImages: Array.isArray(offer.images)
      ? offer.images.filter((i) => !i.isCover).map((i) => i.url)
      : [],
  };
}

/* ─── Vista multimedia para diseñadores ─────────────────────────────── */

function DesignerMediaView({ slug, offerId, form, update }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function guardarImagen() {
    if (!offerId) return;
    if (!form.coverImage) {
      toastError('Selecciona una imagen antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/ofertas/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar.');
      toastSuccess('Imagen actualizada correctamente.');
      router.push('/admin/ofertas');
      router.refresh();
    } catch (err) {
      toastError(err, 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className='mx-auto max-w-xl space-y-6'>
      <PageHeader
        crumbs={[{ label: 'Ofertas', href: '/admin/ofertas' }, { label: 'Multimedia' }]}
        title='Editar multimedia'
        description={slug}
      />

      <div className='space-y-6 rounded-2xl border border-default bg-surface p-6 md:p-8'>
        {!form.coverImage && (
          <p className='rounded-lg bg-warning/10 px-4 py-3 text-sm text-foreground'>
            Esta oferta aún no tiene imagen de portada. Subí una para que se publique automáticamente.
          </p>
        )}
        <FieldShell label='Imagen de portada'>
          <CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} />
        </FieldShell>
        <FieldShell label='Galería de imágenes' hint='Imágenes adicionales de la oferta'>
          <GalleryEditor images={form.galleryImages || []} onChange={(imgs) => update('galleryImages', imgs)} />
        </FieldShell>
        <div className='flex justify-end border-t border-default pt-5'>
          <Button
            type='button'
            isPending={guardando}
            onClick={guardarImagen}
            className='h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-orange-500'
          >
            {({ isPending }) => (<>{isPending && <Spinner color='current' size='sm' />}{isPending ? 'Guardando...' : 'Guardar imágenes'}</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────────────────── */

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [offerId, setOfferId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showErrors, setShowErrors] = useState(false);
  const [role, setRole] = useState(null);
  const savedFormRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setRole(data.user.role); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ofertas/${slug}`)
      .then((r) => r.json())
      .then((offer) => {
        if (offer?.id) {
          setOfferId(offer.id);
          const mapped = offerToForm(offer);
          setForm(mapped);
          savedFormRef.current = mapped;
        }
      })
      .catch(() => toastError('No se pudo cargar la oferta.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const hasChanges = Boolean(savedFormRef.current) &&
    JSON.stringify(form) !== JSON.stringify(savedFormRef.current);

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate + 'T12:00:00');
      const end = new Date(form.endDate + 'T12:00:00');
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) setForm((prev) => ({ ...prev, nights: diffDays, days: diffDays + 1 }));
    }
  }, [form.startDate, form.endDate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const fieldErrors = validateOfferForm(form);
  const errorCount = Object.keys(fieldErrors).length;

  async function guardarOferta() {
    if (errorCount > 0) { setShowErrors(true); return; }
    if (!offerId) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/ofertas/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la oferta.');
      savedFormRef.current = form;
      toastSuccess('Oferta actualizada correctamente');
      router.push('/admin/ofertas');
      router.refresh();
    } catch (err) {
      toastError(err, 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (role === 'designer') {
    return (
      <DesignerMediaView
        slug={slug}
        offerId={offerId}
        form={form}
        update={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
      />
    );
  }

  return (
    <div className='max-w-[1240px] space-y-6'>
      <PageHeader
        crumbs={[{ label: 'Ofertas', href: '/admin/ofertas' }, { label: 'Editar' }]}
        title='Editar oferta'
        description={slug}
        actions={hasChanges && (
          <Chip color='warning' variant='soft'>
            <Chip.Label className='flex items-center gap-1.5'>
              <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500' />
              Cambios sin guardar
            </Chip.Label>
          </Chip>
        )}
      />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]'>
        <OfferFormBody form={form} update={update} setForm={setForm} showErrors={showErrors} fieldErrors={fieldErrors} />
        <OfferPreviewPanel
          form={form}
          update={update}
          fieldErrors={fieldErrors}
          showErrors={showErrors}
          pending={guardando}
          pendingLabel='Guardando...'
          label='Guardar cambios'
          onSave={guardarOferta}
          errorCount={errorCount}
        />
      </div>
    </div>
  );
}
