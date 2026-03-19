'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Checkbox, Description, NumberField, Spinner } from '@heroui/react';
import { Check, Minus, Plus } from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toast';
import HeroSelect from '@/components/ui/hero-select';
import AirlineCombobox from '@/components/ui/airline-combobox';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';

const pasos = [
  { id: 1, label: 'General' },
  { id: 2, label: 'Logística' },
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
  { value: 'direct', label: 'Directo' },
  { value: 'stops', label: 'Con escala' },
];

const initialForm = {
  title: '', tripType: 'round-trip', customRoute: '',
  originCountry: 'Argentina', originCity: '',
  destinationCountry: '', destinationCity: '', destinationAirport: '',
  startDate: '', endDate: '', availableMonths: '', days: 7, nights: 6,
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
    availableMonths: avail.availableMonths || '',
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

/* ─── Componentes visuales ───────────────────────────────────────────── */

function StepperBar({ pasos, paso, onGoToStep }) {
  return (
    <div className='flex items-start gap-0'>
      {pasos.map((step, i) => {
        const active = step.id === paso;
        const done = step.id < paso;
        return (
          <div key={step.id} className='flex items-start flex-1 min-w-0'>
            <div className='flex flex-col items-center min-w-0 flex-1'>
              <button
                type='button'
                onClick={() => onGoToStep(step.id)}
                className='flex flex-col items-center gap-2 group'
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${active
                  ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-110'
                  : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-secondary border-2 border-default text-muted/50'
                  }`}>
                  {done ? <Check size={15} strokeWidth={2.5} /> : step.id}
                </div>
                <span className={`text-[10px] uppercase tracking-[0.12em] font-bold whitespace-nowrap transition-colors ${active ? 'text-accent' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted/60'
                  }`}>
                  {step.label}
                </span>
              </button>
            </div>
            {i < pasos.length - 1 && (
              <div className='flex-1 flex items-start pt-[18px] px-1'>
                <div className={`h-[2px] w-full rounded-full transition-colors duration-300 ${paso > step.id ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-border'
                  }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-default/60 bg-surface-secondary/40 p-5 space-y-4 ${className}`}>
      {title && <p className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted/70'>{title}</p>}
      {children}
    </div>
  );
}

function FL({ children }) {
  return <span className='text-[10px] uppercase tracking-[0.15em] font-semibold text-muted block mb-1.5'>{children}</span>;
}

function FInput({ error, className = '', ...props }) {
  return (
    <input
      className={`h-11 px-3.5 rounded-xl border w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all ${error ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-default hover:border-muted/50'
        } ${className}`}
      {...props}
    />
  );
}

function FError({ children }) {
  if (!children) return null;
  return <p className='text-xs text-rose-500 mt-1 flex items-center gap-1'>⚠ {children}</p>;
}

function NumField({ label, value, onChange, min = 0, withButtons = false, formatOptions }) {
  return (
    <div className='space-y-1.5'>
      <FL>{label}</FL>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        formatOptions={formatOptions ?? { maximumFractionDigits: 0, useGrouping: false }}
        className='w-full'
      >
        <NumberField.Group className='h-11 rounded-xl border border-default flex items-center overflow-hidden bg-surface hover:border-muted/50 transition-colors'>
          {withButtons && (
            <NumberField.DecrementButton className='h-full px-3 hover:bg-surface-secondary border-r border-default transition-colors flex items-center text-muted'>
              <Minus size={13} />
            </NumberField.DecrementButton>
          )}
          <NumberField.Input className='flex-1 h-full px-3.5 bg-transparent text-sm outline-none min-w-0 text-center' />
          {withButtons && (
            <NumberField.IncrementButton className='h-full px-3 hover:bg-surface-secondary border-l border-default transition-colors flex items-center text-muted'>
              <Plus size={13} />
            </NumberField.IncrementButton>
          )}
        </NumberField.Group>
      </NumberField>
    </div>
  );
}

function PillToggle({ options, value, onChange }) {
  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((op) => (
        <button
          key={op.value}
          type='button'
          onClick={() => onChange(op.value)}
          className={`h-9 px-4 rounded-full text-sm font-semibold border transition-all duration-150 ${value === op.value
            ? 'bg-accent text-white border-accent shadow-sm shadow-accent/20'
            : 'bg-surface border-default text-muted hover:border-accent/40 hover:text-foreground'
            }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

function LuggageChip({ label, checked, onChange }) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className={`h-8 px-4 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 ${checked
        ? 'bg-accent/10 text-accent border-accent/30'
        : 'bg-surface border-default text-muted hover:border-accent/30'
        }`}
    >
      {checked && <Check size={11} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

function CheckPill({ label, checked, onChange, note }) {
  return (
    <div>
      <Checkbox isSelected={checked} onChange={onChange}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <span className='text-sm font-medium'>{label}</span>
        </Checkbox.Content>
      </Checkbox>
      {note && <Description>{note}</Description>}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className='flex gap-4 py-2.5 px-4 border-b border-default/50 last:border-0'>
      <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>{label}</span>
      <span className='flex-1 text-sm font-medium text-foreground'>{value}</span>
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
        <p className='text-[10px] uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
          <Link href='/admin/ofertas' className='hover:text-accent transition-colors'>Ofertas</Link>
          <span className='mx-1.5 opacity-40'>·</span>Multimedia
        </p>
        <h2 className='text-3xl font-bold tracking-tight'>Editar multimedia</h2>
        <p className='text-xs text-muted font-mono mt-1'>{slug}</p>
      </section>

      <div className='rounded-2xl border border-default bg-surface p-6 md:p-8 space-y-6'>
        {!form.coverImage && (
          <div className='rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2'>
            <span className='text-base leading-none mt-0.5'>⚠</span>
            <span>Esta oferta aún no tiene imagen de portada. Subí una para que se publique automáticamente.</span>
          </div>
        )}
        <div className='space-y-2'>
          <FL>Imagen de portada</FL>
          <CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} />
        </div>
        <div className='space-y-2'>
          <FL>Galería de imágenes</FL>
          <p className='text-xs text-muted mb-2'>Imágenes adicionales de la oferta.</p>
          <GalleryEditor images={form.galleryImages || []} onChange={(imgs) => update('galleryImages', imgs)} />
        </div>
        <div className='pt-2 border-t border-default flex justify-end'>
          <Button type='button' isPending={guardando} onClick={guardarImagen}
            className='h-11 px-6 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'>
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
      .catch(() => { });
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
    if (paso === 2) return true;
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
    <div className='space-y-8 max-w-4xl'>
      <section>
        <p className='text-[10px] uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
          <Link href='/admin/ofertas' className='hover:text-accent transition-colors'>Ofertas</Link>
          <span className='mx-1.5 opacity-40'>·</span>Editar
        </p>
        <h2 className='text-3xl font-bold tracking-tight'>Editar oferta</h2>
        <p className='text-xs text-muted font-mono mt-1'>{slug}</p>
      </section>

      <StepperBar pasos={pasos} paso={paso} onGoToStep={setPaso} />

      <section className='rounded-2xl border border-default bg-surface p-6 md:p-8 space-y-6'>

        {paso === 1 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Información general</h3>
              <p className='text-sm text-muted mt-0.5'>Define el destino, la ruta y las imágenes.</p>
            </div>
            <Panel title='Título de la oferta'>
              <div>
                <FInput value={form.title} onChange={(e) => update('title', e.target.value)}
                  error={showErrors && !form.title} className='text-base h-12 font-medium' />
                <FError>{showErrors && !form.title ? 'El título es obligatorio.' : null}</FError>
              </div>
            </Panel>
            <Panel title='Tipo de viaje'>
              <PillToggle options={opcionesTipoViaje} value={form.tripType} onChange={(v) => update('tripType', v)} />
            </Panel>
            {form.tripType === 'multi' ? (
              <Panel title='Ruta completa'>
                <div>
                  <FL>Descripción de la ruta *</FL>
                  <FInput value={form.customRoute} onChange={(e) => update('customRoute', e.target.value)}
                    placeholder='Buenos Aires → Lima → Bogotá → Buenos Aires' error={showErrors && !form.customRoute} />
                  <FError>{showErrors && !form.customRoute ? 'La ruta es obligatoria para viajes multi-destino.' : null}</FError>
                </div>
              </Panel>
            ) : (
              <Panel title='Ruta'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div><FL>País de origen</FL><CountryCombobox value={form.originCountry} onChange={(v) => update('originCountry', v)} placeholder='Argentina' /></div>
                  <div><FL>Ciudad de origen</FL><FInput value={form.originCity} onChange={(e) => update('originCity', e.target.value)} placeholder='Buenos Aires' /></div>
                  <div>
                    <FL>País de destino *</FL>
                    <CountryCombobox value={form.destinationCountry} onChange={(v) => update('destinationCountry', v)} placeholder='Seleccionar país...' />
                    <FError>{showErrors && !form.destinationCountry ? 'El país de destino es obligatorio.' : null}</FError>
                  </div>
                  <div><FL>Ciudad de destino</FL><FInput value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} placeholder='Lima' /></div>
                  <div><FL>Código IATA aeropuerto</FL><FInput value={form.destinationAirport} onChange={(e) => update('destinationAirport', e.target.value)} placeholder='LIM' className='font-mono' /></div>
                </div>
              </Panel>
            )}
            <Panel title='Imágenes'>
              <div className='space-y-5'>
                <div><FL>Imagen de portada</FL><CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} /></div>
                <div>
                  <FL>Galería adicional</FL>
                  <p className='text-xs text-muted mb-2'>Imágenes que se muestran en la página de la oferta.</p>
                  <GalleryEditor images={form.galleryImages || []} onChange={(imgs) => update('galleryImages', imgs)} />
                </div>
              </div>
            </Panel>
          </div>
        )}

        {paso === 2 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Logística y precios</h3>
              <p className='text-sm text-muted mt-0.5'>Fechas, duración, vuelo y precios.</p>
            </div>
            <Panel title='Fechas del viaje'>
              <div>
                <FL>Rango de fechas</FL>
                <RangeDatePickerField startDate={form.startDate} endDate={form.endDate} tripType={form.tripType}
                  onChange={({ start, end }) => setForm((prev) => ({ ...prev, startDate: start, endDate: end }))} />
              </div>
              <div>
                <FL>Meses disponibles (opcional)</FL>
                <FInput value={form.availableMonths} onChange={(e) => update('availableMonths', e.target.value)} placeholder='Ej: Enero a Marzo, Junio a Agosto' />
                <p className='text-xs text-muted mt-1'>Se muestra si no hay fechas exactas.</p>
              </div>
            </Panel>
            {(form.startDate || form.endDate) && (
              <Panel title='Duración'>
                {form.startDate && form.endDate && <p className='text-xs text-accent font-medium -mb-1'>Calculado automáticamente · puedes ajustar</p>}
                <div className='grid grid-cols-2 gap-4'>
                  <NumField label='Días' value={form.days} onChange={(v) => update('days', v ?? 1)} min={1} withButtons />
                  <NumField label='Noches' value={form.nights} onChange={(v) => update('nights', v ?? 0)} min={0} withButtons />
                </div>
              </Panel>
            )}
            <Panel title='Vuelo'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div><FL>Aerolínea</FL><AirlineCombobox value={form.airline} iata={form.airlineIata} onChange={({ name, iata }) => setForm((prev) => ({ ...prev, airline: name, airlineIata: iata }))} /></div>
                <div><FL>Tipo de vuelo</FL><PillToggle options={opcionesTipoVuelo} value={form.flightType} onChange={(v) => update('flightType', v)} /></div>
              </div>
              <div>
                <FL>Equipaje incluido</FL>
                <div className='flex flex-wrap gap-2'>
                  <LuggageChip label='Artículo personal' checked={form.luggagePersonal} onChange={(v) => update('luggagePersonal', v)} />
                  <LuggageChip label='Carry on' checked={form.luggageCarryOn} onChange={(v) => update('luggageCarryOn', v)} />
                  <LuggageChip label='Equipaje despachado' checked={form.luggageChecked} onChange={(v) => update('luggageChecked', v)} />
                </div>
              </div>
            </Panel>
            <Panel title='Precio'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <FL>Moneda</FL>
                  <HeroSelect value={form.currency} onValueChange={(v) => update('currency', v)} options={opcionesMoneda} triggerClassName='h-11 rounded-xl border border-default bg-surface hover:border-muted/50 transition-colors' />
                </div>
                <NumField label='Precio base' value={form.price} onChange={(v) => update('price', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
                <NumField label='Precio original (tachado)' value={form.originalPrice} onChange={(v) => update('originalPrice', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
                <div><FL>Aclaración de precio</FL><FInput value={form.priceNote} onChange={(e) => update('priceNote', e.target.value)} placeholder='por persona' /></div>
                <NumField label='Cupos disponibles' value={form.seats} onChange={(v) => update('seats', v ?? 1)} min={1} withButtons />
                <div><FL>Hotel</FL><FInput value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} placeholder='Nombre del hotel (opcional)' /></div>
              </div>
            </Panel>
          </div>
        )}

        {paso === 3 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Contenido</h3>
              <p className='text-sm text-muted mt-0.5'>Descripción, inclusiones y puntos destacados.</p>
            </div>
            <Panel title='Descripción'>
              <div>
                <FL>Resumen comercial</FL>
                <textarea className='min-h-28 px-3.5 py-3 rounded-xl border border-default w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 resize-y hover:border-muted/50 transition-all'
                  value={form.summary} onChange={(e) => update('summary', e.target.value)} placeholder='Descripción breve para la tarjeta de oferta...' />
              </div>
            </Panel>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Panel title='Incluye'><ItemListInput label='' items={form.includes} onChange={(v) => update('includes', v)} placeholder='Ej: Vuelos, Hotel...' /></Panel>
              <Panel title='No incluye'><ItemListInput label='' items={form.notIncludes} onChange={(v) => update('notIncludes', v)} placeholder='Ej: Propinas...' /></Panel>
            </div>
            <Panel title='Highlights'><ItemListInput label='' items={form.highlights} onChange={(v) => update('highlights', v)} placeholder='Ej: Asistencia local...' /></Panel>
          </div>
        )}

        {paso === 4 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Revisión</h3>
              <p className='text-sm text-muted mt-0.5'>Revisa los datos antes de guardar.</p>
            </div>
            <div className='rounded-2xl border border-default bg-surface-secondary/50 overflow-hidden'>
              <ReviewRow label='Título' value={form.title || '—'} />
              <ReviewRow label='Ruta' value={buildRouteLabel(form)} />
              <ReviewRow label='Aerolínea' value={form.airline ? `${form.airline} · ${form.flightType === 'direct' ? 'Directo' : 'Con escala'}` : '—'} />
              <ReviewRow label='Salida' value={form.startDate || '—'} />
              <ReviewRow label='Regreso' value={form.endDate || '—'} />
              {form.availableMonths && <ReviewRow label='Meses' value={form.availableMonths} />}
              {(form.startDate || form.endDate) && <ReviewRow label='Duración' value={`${form.days} días / ${form.nights} noches`} />}
              <ReviewRow label='Precio' value={`${formatPrice(form.price, form.currency)}${form.priceNote ? ` ${form.priceNote}` : ''}`} />
              {form.originalPrice ? <ReviewRow label='P. original' value={formatPrice(form.originalPrice, form.currency)} /> : null}
              {form.hotelName ? <ReviewRow label='Hotel' value={form.hotelName} /> : null}
              {form.includes.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 border-b border-default/50 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>Incluye</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.includes.map((item, i) => <span key={i} className='px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400'>{item}</span>)}
                  </div>
                </div>
              )}
              {form.notIncludes.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>No incluye</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.notIncludes.map((item, i) => <span key={i} className='px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium dark:bg-rose-900/30 dark:text-rose-400'>{item}</span>)}
                  </div>
                </div>
              )}
            </div>
            {form.isSpecialOffer && (
              <div className='rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2'>
                <span className='text-base leading-none mt-0.5'>⚠</span>
                <span>Esta oferta será marcada como oferta especial. La anterior será desactivada automáticamente.</span>
              </div>
            )}
            <Panel title='Publicación'>
              <div className='grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start'>
                <div>
                  <FL>Estado</FL>
                  <HeroSelect value={form.status} onValueChange={(v) => update('status', v)} options={opcionesEstado}
                    triggerClassName={`h-11 rounded-xl border bg-surface transition-colors ${showErrors && !form.status ? 'border-rose-400' : 'border-default hover:border-muted/50'}`} />
                  <FError>{showErrors && !form.status ? 'Selecciona un estado.' : null}</FError>
                </div>
                <div className='space-y-3 md:pt-6'>
                  <CheckPill label='Marcar como oferta destacada' checked={form.featured} onChange={(v) => update('featured', v)} />
                  <CheckPill label='Marcar como oferta especial' checked={form.isSpecialOffer} onChange={(v) => update('isSpecialOffer', v)}
                    note='Solo puede haber una a la vez. Marcar aquí desactivará la anterior.' />
                </div>
              </div>
            </Panel>
          </div>
        )}

        <div className='pt-5 border-t border-default flex items-center justify-between gap-4'>
          <button type='button' onClick={goBack} disabled={paso === 1 || guardando}
            className='h-11 px-6 rounded-xl border border-default bg-surface hover:bg-surface-secondary disabled:opacity-30 text-sm font-semibold text-foreground transition-all disabled:cursor-not-allowed'>
            ← Atrás
          </button>
          <span className='text-xs text-muted font-medium hidden sm:block'>Paso {paso} de {pasos.length}</span>
          {paso < 4 ? (
            <Button type='button' onClick={tryGoNext}
              className='h-11 px-6 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'>
              Siguiente →
            </Button>
          ) : (
            <Button type='button' isPending={guardando} onClick={guardarOferta}
              className='h-11 px-6 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'>
              {({ isPending }) => (<>{isPending && <Spinner color='current' size='sm' />}{isPending ? 'Guardando...' : 'Guardar cambios'}</>)}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
