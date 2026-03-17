'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Checkbox, NumberField, Spinner } from '@heroui/react';
import { Minus, Plus } from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toast';
import HeroSelect from '@/components/ui/hero-select';
import AirlineCombobox from '@/components/ui/airline-combobox';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';

const pasos = [
  { id: 1, label: 'Información general' },
  { id: 2, label: 'Logística y precios' },
  { id: 3, label: 'Contenido' },
  { id: 4, label: 'Revisión' },
];

const opcionesMoneda = [
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
];

const opcionesEstado = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
];

const opcionesTipoViaje = [
  { value: 'round-trip', label: 'Ida y vuelta' },
  { value: 'one-way', label: 'Solo ida' },
  { value: 'multi', label: 'Multi-destino' },
];

const opcionesTipoVuelo = [
  { value: 'direct', label: 'Vuelo directo' },
  { value: 'stops', label: 'Con escala' },
];

const initialForm = {
  title: '', tripType: 'round-trip', customRoute: '',
  originCountry: 'Argentina', originCity: '',
  destinationCountry: '', destinationCity: '', destinationAirport: '',
  startDate: '', endDate: '', days: 7, nights: 6,
  airline: '', airlineIata: '', flightType: 'direct',
  luggagePersonal: true, luggageCarryOn: true, luggageChecked: false,
  currency: 'ARS', price: null, originalPrice: null, priceNote: 'por persona',
  seats: 12, status: 'draft', featured: false, isSpecialOffer: false, summary: '',
  includes: [], notIncludes: [], highlights: [],
  coverImage: '', hotelName: '', galleryImages: [],
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
    days: offer.duration?.days || 7,
    nights: offer.duration?.nights || 6,
    airline: offer.airline?.name || '',
    airlineIata: offer.airline?.iata || '',
    flightType: offer.flight?.type || 'direct',
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
    galleryImages: Array.isArray(offer.images)
      ? offer.images.filter((i) => !i.isCover).map((i) => i.url)
      : [],
  };
}

function buildRouteLabel(form) {
  if (form.tripType === 'multi') return form.customRoute || '—';
  const origin = form.originCity || form.originCountry || '?';
  const dest = form.destinationCity || form.destinationCountry || '?';
  if (form.tripType === 'round-trip') return `${origin} → ${dest} → ${origin}`;
  return `${origin} → ${dest}`;
}

function formatPrice(value, currency) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function SectionTitle({ children }) {
  return <h3 className='text-xl font-bold border-b border-default pb-2 mb-4'>{children}</h3>;
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <span className='text-sm font-medium block'>{label}</span>}
      {children}
    </div>
  );
}

function NumField({ label, value, onChange, min = 0, withButtons = false, formatOptions }) {
  return (
    <Field label={label}>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        formatOptions={formatOptions ?? { maximumFractionDigits: 0, useGrouping: false }}
        className='w-full'
      >
        <NumberField.Group className='h-10 rounded-lg border border-default flex items-center overflow-hidden bg-surface'>
          {withButtons && (
            <NumberField.DecrementButton className='h-full px-3 hover:bg-surface-secondary border-r border-default transition-colors flex items-center'>
              <Minus size={14} />
            </NumberField.DecrementButton>
          )}
          <NumberField.Input className='flex-1 h-full px-3 bg-transparent text-sm outline-none min-w-0' />
          {withButtons && (
            <NumberField.IncrementButton className='h-full px-3 hover:bg-surface-secondary border-l border-default transition-colors flex items-center'>
              <Plus size={14} />
            </NumberField.IncrementButton>
          )}
        </NumberField.Group>
      </NumberField>
    </Field>
  );
}

function LuggageCheck({ label, checked, onChange }) {
  return (
    <Checkbox isSelected={checked} onChange={onChange} className='flex items-center gap-2 cursor-pointer'>
      <Checkbox.Control className='w-5 h-5 rounded-full border border-default flex items-center justify-center bg-surface data-selected:bg-accent data-selected:border-accent transition-colors shrink-0'>
        <Checkbox.Indicator className='text-white w-full h-full flex items-center justify-center' />
      </Checkbox.Control>
      <Checkbox.Content className='text-sm'>{label}</Checkbox.Content>
    </Checkbox>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className='px-4 py-3 flex gap-6'>
      <span className='text-muted w-32 shrink-0'>{label}</span>
      <span className='flex-1'>{value}</span>
    </div>
  );
}

/* ─── Vista multimedia para diseñadores ─────────────────────────────── */

function DesignerMediaView({ slug, offerId, form, update }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function guardarImagen() {
    if (!offerId) return;
    if (!form.coverImage) {
      toastError('Seleccioná una imagen antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/ofertas/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
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
    <div className='space-y-6 max-w-xl'>
      <section>
        <p className='text-sm text-muted mb-1'>
          <Link href='/admin/ofertas' className='hover:underline'>Ofertas</Link> / Multimedia
        </p>
        <h2 className='text-4xl font-bold'>Editar multimedia</h2>
        <p className='text-muted text-sm mt-1 font-mono text-xs'>{slug}</p>
      </section>

      <div className='rounded-2xl border border-default bg-surface p-5 md:p-7 space-y-6'>
        {!form.coverImage && (
          <div className='rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300'>
            Esta oferta aún no tiene imagen de portada. Subí una para que se publique automáticamente.
          </div>
        )}

        {/* Portada */}
        <div className='space-y-2'>
          <h3 className='text-base font-semibold'>Imagen de portada</h3>
          <CoverImageInput
            value={form.coverImage}
            onChange={(url) => update('coverImage', url)}
          />
        </div>

        {/* Galería adicional */}
        <div className='space-y-2'>
          <h3 className='text-base font-semibold'>Galería de imágenes</h3>
          <p className='text-sm text-muted'>Imágenes adicionales que se muestran en la página de la oferta.</p>
          <GalleryEditor
            images={form.galleryImages || []}
            onChange={(imgs) => update('galleryImages', imgs)}
          />
        </div>

        <div className='pt-2 border-t border-default flex justify-end'>
          <Button
            type='button'
            isPending={guardando}
            onClick={guardarImagen}
            className='h-10 px-5 bg-accent text-white font-semibold text-sm'
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color='current' size='sm' />}
                {isPending ? 'Guardando...' : 'Guardar imágenes'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditOfferPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [offerId, setOfferId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paso, setPaso] = useState(1);
  const [maxStep, setMaxStep] = useState(4);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showErrors, setShowErrors] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setRole(data.user.role); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ofertas/${slug}`)
      .then((r) => r.json())
      .then((offer) => {
        if (offer?.id) {
          setOfferId(offer.id);
          setForm(offerToForm(offer));
        }
      })
      .catch(() => toastError('No se pudo cargar la oferta.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate + 'T12:00:00');
      const end = new Date(form.endDate + 'T12:00:00');
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) setForm((prev) => ({ ...prev, nights: diffDays, days: diffDays + 1 }));
    }
  }, [form.startDate, form.endDate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const goBack = () => { setShowErrors(false); setPaso((p) => Math.max(1, p - 1)); };

  const canGoNext = useMemo(() => {
    if (paso === 1) {
      if (form.tripType === 'multi') return Boolean(form.title && form.customRoute);
      return Boolean(form.title && form.destinationCountry);
    }
    if (paso === 2) return Boolean(form.price && form.days > 0);
    if (paso === 4) return Boolean(form.status);
    return true;
  }, [form, paso]);

  function tryGoNext() {
    if (!canGoNext) { setShowErrors(true); return; }
    setShowErrors(false);
    setPaso((p) => Math.min(4, p + 1));
  }

  async function guardarOferta() {
    if (!form.status) { setShowErrors(true); return; }
    if (!offerId) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/ofertas/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la oferta.');
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
      <div className='flex items-center justify-center h-64'>
        <Spinner size='lg' />
      </div>
    );
  }

  // Designers only see the multimedia editing view
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
    <div className='space-y-6 max-w-4xl'>
      <section className='flex flex-col md:flex-row md:items-start md:justify-between gap-3'>
        <div>
          <p className='text-sm text-muted mb-1'>
            <Link href='/admin/ofertas' className='hover:underline'>Ofertas</Link> / Editar
          </p>
          <h2 className='text-4xl font-bold'>Editar oferta</h2>
          <p className='text-muted text-sm mt-1 font-mono text-xs'>{slug}</p>
        </div>
      </section>

      {/* Stepper */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
        {pasos.map((item) => {
          const active = item.id === paso;
          const done = item.id < paso;
          return (
            <button
              key={item.id}
              type='button'
              onClick={() => setPaso(item.id)}
              className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${active
                ? 'bg-accent text-white border-accent'
                : done
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-surface-secondary border-default text-muted'
                }`}
            >
              {done ? '✓' : item.id}. {item.label}
            </button>
          );
        })}
      </div>

      <section className='rounded-2xl border border-default bg-surface p-5 md:p-7 space-y-6'>

        {paso === 1 && (
          <div className='space-y-5'>
            <SectionTitle>Información general</SectionTitle>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Field label='Título de la oferta *' className='md:col-span-2'>
                <input
                  className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.title ? 'border-rose-500' : 'border-default'}`}
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                />
                {showErrors && !form.title && <p className='text-xs text-rose-500 mt-1'>El título es obligatorio.</p>}
              </Field>
              <Field label='Tipo de viaje' className='md:col-span-2'>
                <div className='flex flex-wrap gap-2'>
                  {opcionesTipoViaje.map((op) => (
                    <button
                      key={op.value}
                      type='button'
                      onClick={() => update('tripType', op.value)}
                      className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${form.tripType === op.value ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default hover:bg-surface-tertiary'}`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            {form.tripType === 'multi' ? (
              <Field label='Ruta completa *'>
                <input
                  className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.customRoute ? 'border-rose-500' : 'border-default'}`}
                  value={form.customRoute}
                  onChange={(e) => update('customRoute', e.target.value)}
                  placeholder='Buenos Aires → Lima → Bogotá → Buenos Aires'
                />
              </Field>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='País de origen'>
                  <CountryCombobox value={form.originCountry} onChange={(v) => update('originCountry', v)} placeholder='Argentina' />
                </Field>
                <Field label='Ciudad de origen'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.originCity} onChange={(e) => update('originCity', e.target.value)} />
                </Field>
                <Field label='País de destino *'>
                  <CountryCombobox value={form.destinationCountry} onChange={(v) => update('destinationCountry', v)} />
                  {showErrors && !form.destinationCountry && <p className='text-xs text-rose-500 mt-1'>Obligatorio.</p>}
                </Field>
                <Field label='Ciudad de destino'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} />
                </Field>
                <Field label='Código IATA aeropuerto'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm font-mono bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.destinationAirport} onChange={(e) => update('destinationAirport', e.target.value)} placeholder='LIM' />
                </Field>
              </div>
            )}
            <Field label='Imagen de portada'>
              <CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} />
            </Field>
            <Field label='Galería de imágenes'>
              <p className='text-xs text-muted mb-2'>Imágenes adicionales que se muestran en la página de la oferta.</p>
              <GalleryEditor
                images={form.galleryImages || []}
                onChange={(imgs) => update('galleryImages', imgs)}
              />
            </Field>
          </div>
        )}

        {paso === 2 && (
          <div className='space-y-6'>
            <SectionTitle>Logística y precios</SectionTitle>
            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Fechas del viaje</p>
              <RangeDatePickerField
                startDate={form.startDate}
                endDate={form.endDate}
                tripType={form.tripType}
                onChange={({ start, end }) => setForm((prev) => ({ ...prev, startDate: start, endDate: end }))}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <NumField label='Días' value={form.days} onChange={(v) => update('days', v ?? 1)} min={1} withButtons />
              <NumField label='Noches' value={form.nights} onChange={(v) => update('nights', v ?? 0)} min={0} withButtons />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Field label='Aerolínea'>
                <AirlineCombobox value={form.airline} iata={form.airlineIata} onChange={({ name, iata }) => setForm((prev) => ({ ...prev, airline: name, airlineIata: iata }))} />
              </Field>
              <Field label='Tipo de vuelo'>
                <div className='flex gap-2'>
                  {opcionesTipoVuelo.map((op) => (
                    <button key={op.value} type='button' onClick={() => update('flightType', op.value)}
                      className={`h-10 flex-1 rounded-lg text-sm font-medium border transition-colors ${form.flightType === op.value ? 'bg-accent text-white border-accent' : 'bg-surface-secondary border-default hover:bg-surface-tertiary'}`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className='mt-4'>
              <span className='text-sm font-medium block mb-2'>Equipaje incluido</span>
              <div className='flex flex-wrap gap-4'>
                <LuggageCheck label='Artículo personal' checked={form.luggagePersonal} onChange={(v) => update('luggagePersonal', v)} />
                <LuggageCheck label='Carry on' checked={form.luggageCarryOn} onChange={(v) => update('luggageCarryOn', v)} />
                <LuggageCheck label='Equipaje despachado' checked={form.luggageChecked} onChange={(v) => update('luggageChecked', v)} />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Field label='Moneda'>
                <HeroSelect value={form.currency} onValueChange={(v) => update('currency', v)} options={opcionesMoneda} triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary' />
              </Field>
              <div>
                <NumField label='Precio base *' value={form.price} onChange={(v) => update('price', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
                {showErrors && !form.price && <p className='text-xs text-rose-500 mt-1'>Obligatorio.</p>}
              </div>
              <NumField label='Precio original (tachado)' value={form.originalPrice} onChange={(v) => update('originalPrice', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
              <Field label='Aclaración de precio'>
                <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.priceNote} onChange={(e) => update('priceNote', e.target.value)} />
              </Field>
              <NumField label='Cupos disponibles' value={form.seats} onChange={(v) => update('seats', v ?? 1)} min={1} withButtons />
              <Field label='Hotel'>
                <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className='space-y-6'>
            <SectionTitle>Contenido</SectionTitle>
            <Field label='Resumen comercial'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.summary} onChange={(e) => update('summary', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <ItemListInput label='¿Qué incluye?' items={form.includes} onChange={(v) => update('includes', v)} placeholder='Ej: Vuelos...' />
              <ItemListInput label='¿Qué no incluye?' items={form.notIncludes} onChange={(v) => update('notIncludes', v)} placeholder='Ej: Propinas...' />
            </div>
            <ItemListInput label='Highlights' items={form.highlights} onChange={(v) => update('highlights', v)} placeholder='Ej: Asistencia local...' />
          </div>
        )}

        {paso === 4 && (
          <div className='space-y-5'>
            <SectionTitle>Revisión</SectionTitle>
            <div className='rounded-xl border border-default bg-surface-secondary divide-y divide-default overflow-hidden text-sm'>
              <ReviewRow label='Título' value={form.title || '—'} />
              <ReviewRow label='Ruta' value={buildRouteLabel(form)} />
              <ReviewRow label='Duración' value={`${form.days} días / ${form.nights} noches`} />
              <ReviewRow label='Salida' value={form.startDate || '—'} />
              <ReviewRow label='Regreso' value={form.endDate || '—'} />
              <ReviewRow label='Precio' value={`${formatPrice(form.price, form.currency)}${form.priceNote ? ` ${form.priceNote}` : ''}`} />
              {form.originalPrice ? <ReviewRow label='Precio original' value={formatPrice(form.originalPrice, form.currency)} /> : null}
              {form.hotelName ? <ReviewRow label='Hotel' value={form.hotelName} /> : null}
            </div>
            <div className='flex items-center gap-4'>
              <Field label='Estado'>
                <HeroSelect value={form.status} onValueChange={(v) => update('status', v)} options={opcionesEstado} triggerClassName={`h-10 rounded-lg border bg-surface-secondary w-48 ${showErrors && !form.status ? 'border-rose-500' : 'border-default'}`} />
                {showErrors && !form.status && <p className='text-xs text-rose-500 mt-1'>Seleccioná un estado.</p>}
              </Field>
              <LuggageCheck label='Oferta destacada' checked={form.featured} onChange={(v) => update('featured', v)} />
              <div className='space-y-0.5'>
                <LuggageCheck
                  label='Marcar como oferta especial'
                  checked={form.isSpecialOffer}
                  onChange={(v) => update('isSpecialOffer', v)}
                />
                <p className='text-xs text-muted ml-7'>Solo puede haber una a la vez. Marcar aquí desactivará la anterior.</p>
              </div>
            </div>
          </div>
        )}

        <div className='pt-4 border-t border-default flex items-center justify-between'>
          <Button type='button' onClick={goBack} disabled={paso === 1 || guardando}
            className='h-10 px-5 rounded-lg border border-default bg-surface hover:bg-surface-secondary disabled:opacity-40 text-sm font-medium text-foreground'>
            Atrás
          </Button>
          <span className='text-xs text-muted'>Paso {paso} de {pasos.length}</span>
          {paso < 4 ? (
            <Button type='button' onClick={tryGoNext} className='h-10 px-5 rounded-lg bg-accent text-white font-semibold text-sm'>
              Siguiente →
            </Button>
          ) : (
            <Button type='button' isPending={guardando} onClick={guardarOferta} className='h-10 px-5 bg-accent text-white font-semibold text-sm'>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color='current' size='sm' />}
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
                </>
              )}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
