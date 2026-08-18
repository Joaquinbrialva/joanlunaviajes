'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Spinner, Tooltip } from '@heroui/react';
import { Info } from 'lucide-react';
import { toastError } from '@/lib/toast';
import { PageHeader, LinkButton } from '@/components/admin/kit';
import {
  StepperBar, FieldGroup, FL, FInput, FError, NumField,
  PillToggle, LuggageChip, CheckPill, ReviewRow, StarSelector,
} from '@/components/admin/form-ui';
import HeroSelect from '@/components/ui/hero-select';
import AirlineCombobox from '@/components/ui/airline-combobox';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';
import HotelAddressSearch from '@/components/ui/hotel-address-search';

/* ─── Opciones estáticas ─────────────────────────────────────────────── */

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

/* ─── Helpers ────────────────────────────────────────────────────────── */

function buildRouteLabel(form) {
  if (form.tripType === 'multi') return form.customRoute || '—';
  const origin = form.originCity || form.originCountry || '?';
  const dest = form.destinationCity || form.destinationCountry || '?';
  if (form.tripType === 'round-trip') return `${origin} → ${dest} → ${origin}`;
  return `${origin} → ${dest}`;
}

function formatPrice(value, currency) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ─── Estado inicial ─────────────────────────────────────────────────── */

const initialForm = {
  title: '',
  tripType: 'round-trip',
  customRoute: '',
  originCountry: '',
  originCity: '',
  destinationCountry: '',
  destinationCity: '',
  destinationAirport: '',
  startDate: '',
  endDate: '',
  availableMonths: '',
  days: null,
  nights: null,
  airline: '',
  airlineIata: '',
  flightType: 'direct',
  layoverCity: '',
  luggagePersonal: false,
  luggageCarryOn: false,
  luggageChecked: false,
  currency: 'ARS',
  price: null,
  originalPrice: null,
  priceNote: '',
  seats: 1,
  status: 'draft',
  featured: false,
  isSpecialOffer: false,
  summary: '',
  includes: [],
  notIncludes: [],
  highlights: [],
  coverImage: '',
  galleryImages: [],
  hotelName: '',
  hasHotel: false,
  hotelStars: 0,
  hotelAddress: '',
  hotelPlaceId: '',
  hotelMapsUrl: '',
};

const DRAFT_KEY = 'admin_nueva_oferta_draft';

/* ─── Página principal ───────────────────────────────────────────────── */

export default function AdminNewOfferPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
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
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setForm(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { }
  }, [form]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const goBack = () => { setShowErrors(false); setPaso((p) => Math.max(1, p - 1)); };

  function tryGoNext() {
    if (!canGoNext) { setShowErrors(true); return; }
    setShowErrors(false);
    setPaso((p) => {
      const next = Math.min(4, p + 1);
      setMaxStep((m) => Math.max(m, next));
      return next;
    });
  }

  function goToStep(id) {
    if (id > maxStep) return;
    setShowErrors(false);
    setPaso(id);
  }

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate + 'T12:00:00');
      const end = new Date(form.endDate + 'T12:00:00');
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setForm((prev) => ({ ...prev, nights: diffDays, days: diffDays + 1 }));
      }
    }
  }, [form.startDate, form.endDate]);

  const canGoNext = useMemo(() => {
    if (paso === 1) {
      if (form.tripType === 'multi') return Boolean(form.title && form.customRoute);
      return Boolean(form.title && form.destinationCountry);
    }
    if (paso === 2) return true;
    return true;
  }, [form, paso]);

  async function guardarOferta() {
    if (!form.status) { setShowErrors(true); return; }
    setGuardando(true);
    try {
      const res = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la oferta.');
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
      router.push('/admin/ofertas');
    } catch (err) {
      toastError(err, 'No se pudo guardar la oferta');
    } finally {
      setGuardando(false);
    }
  }

  if (role === 'designer') {
    return (
      <div className='flex flex-col items-center justify-center gap-4 py-20 text-center'>
        <div className='grid h-14 w-14 place-content-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-900/30'>
          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' /><line x1='12' y1='8' x2='12' y2='12' /><line x1='12' y1='16' x2='12.01' y2='16' /></svg>
        </div>
        <div>
          <h2 className='text-2xl font-bold'>Sin permiso</h2>
          <p className='text-muted mt-1'>Los diseñadores no pueden crear ofertas.</p>
        </div>
        <LinkButton href='/admin/ofertas'>Volver a ofertas</LinkButton>
      </div>
    );
  }

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <PageHeader
        crumbs={[{ label: 'Ofertas', href: '/admin/ofertas' }, { label: 'Nueva' }]}
        title='Nueva oferta'
        description='Completa los datos para publicar una propuesta comercial.'
      />

      {/* Stepper */}
      <StepperBar pasos={pasos} paso={paso} maxStep={maxStep} onGoToStep={goToStep} />

      {/* Contenido del paso */}
      <section className='rounded-2xl border border-default bg-surface p-6 md:p-8 space-y-6'>

        {/* ── PASO 1: Información general ───────────────────────── */}
        {paso === 1 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Información general</h3>
              <p className='text-sm text-muted mt-0.5'>Define el destino, la ruta y las imágenes de la oferta.</p>
            </div>

            <FieldGroup title='Título de la oferta'>
              <div>
                <FInput
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder='Ej: Vuelos nacionales, conoce Argentina'
                  error={showErrors && !form.title}
                  className='text-base h-12 font-medium'
                />
                <FError>{showErrors && !form.title ? 'El título es obligatorio.' : null}</FError>
              </div>
            </FieldGroup>

            <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_2fr] gap-4 items-start'>
              <FieldGroup title='Tipo de viaje'>
                <PillToggle options={opcionesTipoViaje} value={form.tripType} onChange={(v) => update('tripType', v)} />
              </FieldGroup>

              {form.tripType === 'multi' ? (
                <FieldGroup title='Ruta completa'>
                  <div>
                    <FL>Descripción de la ruta *</FL>
                    <FInput
                      value={form.customRoute}
                      onChange={(e) => update('customRoute', e.target.value)}
                      placeholder='Buenos Aires → Lima → Bogotá → Buenos Aires'
                      error={showErrors && !form.customRoute}
                    />
                    <FError>{showErrors && !form.customRoute ? 'La ruta es obligatoria para viajes multi-destino.' : null}</FError>
                  </div>
                </FieldGroup>
              ) : (
                <FieldGroup title='Ruta'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <div>
                      <FL>País de origen</FL>
                      <CountryCombobox value={form.originCountry} onChange={(v) => update('originCountry', v)} placeholder='Argentina' />
                    </div>
                    <div>
                      <FL>Ciudad de origen</FL>
                      <FInput value={form.originCity} onChange={(e) => update('originCity', e.target.value)} placeholder='Buenos Aires' />
                    </div>
                    <div>
                      <FL>Código IATA aeropuerto</FL>
                      <FInput value={form.destinationAirport} onChange={(e) => update('destinationAirport', e.target.value)} placeholder='LIM' className='font-mono' />
                    </div>
                    <div>
                      <FL>País de destino *</FL>
                      <CountryCombobox value={form.destinationCountry} onChange={(v) => update('destinationCountry', v)} placeholder='Seleccionar país...' />
                      <FError>{showErrors && !form.destinationCountry ? 'El país de destino es obligatorio.' : null}</FError>
                    </div>
                    <div>
                      <FL>Ciudad de destino</FL>
                      <FInput value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} placeholder='Lima' />
                    </div>
                  </div>
                </FieldGroup>
              )}
            </div>

            <FieldGroup title='Imágenes'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                <div>
                  <FL>Imagen de portada</FL>
                  <CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} />
                </div>
                <div>
                  <FL>Galería adicional</FL>
                  <p className='text-xs text-muted mb-2'>Imágenes que se muestran en la página de la oferta.</p>
                  <GalleryEditor
                    images={form.galleryImages || []}
                    onChange={(imgs) => update('galleryImages', imgs)}
                  />
                </div>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* ── PASO 2: Logística y precios ───────────────────────── */}
        {paso === 2 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Logística y precios</h3>
              <p className='text-sm text-muted mt-0.5'>Fechas, duración, vuelo y precios.</p>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-start'>
              <FieldGroup title='Fechas del viaje'>
                <div>
                  <FL>Rango de fechas (ida y vuelta)</FL>
                  <RangeDatePickerField
                    startDate={form.startDate}
                    endDate={form.endDate}
                    tripType={form.tripType}
                    onChange={({ start, end }) => setForm((prev) => ({ ...prev, startDate: start, endDate: end }))}
                  />
                </div>
                <div>
                  <FL>Meses disponibles (opcional)</FL>
                  <FInput
                    value={form.availableMonths}
                    onChange={(e) => update('availableMonths', e.target.value)}
                    placeholder='Ej: Enero a Marzo, Junio a Agosto'
                  />
                  <p className='text-xs text-muted mt-1'>Se muestra si no hay fechas exactas.</p>
                </div>
              </FieldGroup>

              {(form.startDate || form.endDate) && (
                <FieldGroup title='Duración'>
                  {form.startDate && form.endDate && (
                    <p className='text-xs text-accent font-medium -mb-1'>Calculado automáticamente · puedes ajustar</p>
                  )}
                  <div className='grid grid-cols-2 gap-4'>
                    <NumField label='Días' value={form.days} onChange={(v) => update('days', v ?? 1)} min={1} withButtons />
                    <NumField label='Noches' value={form.nights} onChange={(v) => update('nights', v ?? 0)} min={0} withButtons />
                  </div>
                </FieldGroup>
              )}
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 items-start'>
              <FieldGroup title='Vuelo'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <FL>Aerolínea</FL>
                    <AirlineCombobox
                      value={form.airline}
                      iata={form.airlineIata}
                      onChange={({ name, iata }) => setForm((prev) => ({ ...prev, airline: name, airlineIata: iata }))}
                    />
                  </div>
                  <div>
                    <FL>Tipo de vuelo</FL>
                    <PillToggle options={opcionesTipoVuelo} value={form.flightType} onChange={(v) => { update('flightType', v); if (v === 'direct') update('layoverCity', ''); }} />
                  </div>
                </div>
                {form.flightType === 'stops' && (
                  <div>
                    <FL>Ciudad de escala</FL>
                    <FInput value={form.layoverCity} onChange={(e) => update('layoverCity', e.target.value)} placeholder='Ej: São Paulo, Lima, Miami...' />
                  </div>
                )}
                <div>
                  <FL>Equipaje incluido</FL>
                  <div className='flex flex-wrap gap-2'>
                    <LuggageChip label='Artículo personal' checked={form.luggagePersonal} onChange={(v) => update('luggagePersonal', v)} />
                    <LuggageChip label='Carry on' checked={form.luggageCarryOn} onChange={(v) => update('luggageCarryOn', v)} />
                    <LuggageChip label='Equipaje despachado' checked={form.luggageChecked} onChange={(v) => update('luggageChecked', v)} />
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup title='Precio'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <FL>Moneda</FL>
                    <HeroSelect
                      value={form.currency}
                      onValueChange={(v) => update('currency', v)}
                      options={opcionesMoneda}
                      triggerClassName='h-11 rounded-xl border border-default bg-surface hover:border-muted/50 transition-colors'
                    />
                  </div>
                  <NumField
                    label='Precio base'
                    value={form.price}
                    onChange={(v) => update('price', v)}
                    min={0}
                    formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }}
                  />
                  <NumField
                    label='Precio original (tachado)'
                    value={form.originalPrice}
                    onChange={(v) => update('originalPrice', v)}
                    min={0}
                    formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }}
                  />
                  <div>
                    <FL>Aclaración de precio</FL>
                    <FInput value={form.priceNote} onChange={(e) => update('priceNote', e.target.value)} placeholder='por persona' />
                  </div>
                  <NumField label='Cupos disponibles' value={form.seats} onChange={(v) => update('seats', v ?? 1)} min={1} withButtons />
                </div>
              </FieldGroup>
            </div>

            <FieldGroup title='Alojamiento'>
              <CheckPill
                label='¿La oferta incluye alojamiento?'
                checked={form.hasHotel}
                onChange={(v) => {
                  if (!v) {
                    setForm((prev) => ({ ...prev, hasHotel: false, hotelName: '', hotelStars: 0, hotelAddress: '', hotelPlaceId: '', hotelMapsUrl: '' }));
                  } else {
                    update('hasHotel', true);
                  }
                }}
              />
              {form.hasHotel && (
                <div className='space-y-4 pt-1'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <FL>Nombre del hotel</FL>
                      <FInput value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} placeholder='Ej: Hotel Sheraton Buenos Aires' />
                    </div>
                    <div>
                      <FL>Categoría (estrellas)</FL>
                      <StarSelector value={form.hotelStars} onChange={(v) => update('hotelStars', v)} />
                    </div>
                  </div>
                  <div>
                    <FL>Dirección</FL>
                    <HotelAddressSearch
                      value={form.hotelAddress}
                      mapsUrl={form.hotelMapsUrl}
                      onChange={({ address, placeId, mapsUrl }) =>
                        setForm((prev) => ({ ...prev, hotelAddress: address, hotelPlaceId: placeId, hotelMapsUrl: mapsUrl }))
                      }
                    />
                  </div>
                </div>
              )}
            </FieldGroup>
          </div>
        )}

        {/* ── PASO 3: Contenido ─────────────────────────────────── */}
        {paso === 3 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Contenido</h3>
              <p className='text-sm text-muted mt-0.5'>Descripción, inclusions y puntos destacados.</p>
            </div>

            <FieldGroup title='Descripción'>
              <div>
                <FL>Resumen comercial</FL>
                <textarea
                  className='min-h-28 px-3.5 py-3 rounded-xl border border-default w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 resize-y hover:border-muted/50 transition-all'
                  value={form.summary}
                  onChange={(e) => update('summary', e.target.value)}
                  placeholder='Descripción breve que aparece en la tarjeta de oferta...'
                />
              </div>
            </FieldGroup>

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              <FieldGroup title='Incluye'>
                <ItemListInput
                  label=''
                  items={form.includes}
                  onChange={(v) => update('includes', v)}
                  placeholder='Ej: Vuelos, Hotel, Traslados...'
                />
              </FieldGroup>
              <FieldGroup title='No incluye'>
                <ItemListInput
                  label=''
                  items={form.notIncludes}
                  onChange={(v) => update('notIncludes', v)}
                  placeholder='Ej: Propinas, Gastos personales...'
                />
              </FieldGroup>
              <FieldGroup title='Highlights' className='md:col-span-2 xl:col-span-1'>
                <ItemListInput
                  label=''
                  items={form.highlights}
                  onChange={(v) => update('highlights', v)}
                  placeholder='Ej: Asistencia local, Coordinación integral...'
                />
              </FieldGroup>
            </div>
          </div>
        )}

        {/* ── PASO 4: Revisión ──────────────────────────────────── */}
        {paso === 4 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Revisión y publicación</h3>
              <p className='text-sm text-muted mt-0.5'>Revisa los datos antes de publicar.</p>
            </div>

            <div className='rounded-2xl bg-surface-secondary/50 overflow-hidden'>
              <ReviewRow label='Título' value={form.title || '—'} />
              <ReviewRow label='Ruta' value={buildRouteLabel(form)} />
              <ReviewRow label='Aerolínea' value={form.airline ? `${form.airline} · ${form.flightType === 'direct' ? 'Directo' : 'Con escala'}` : '—'} />
              <ReviewRow label='Salida' value={form.startDate || '—'} />
              <ReviewRow label='Regreso' value={form.endDate || '—'} />
              {form.availableMonths && <ReviewRow label='Meses' value={form.availableMonths} />}
              {(form.startDate || form.endDate) && <ReviewRow label='Duración' value={`${form.days} días / ${form.nights} noches`} />}
              <ReviewRow label='Precio' value={`${formatPrice(form.price, form.currency)}${form.priceNote ? ` ${form.priceNote}` : ''}`} />
              {form.originalPrice ? <ReviewRow label='Precio original' value={formatPrice(form.originalPrice, form.currency)} /> : null}
              {form.hasHotel && form.hotelName ? (
                <ReviewRow label='Hotel' value={`${form.hotelName}${form.hotelStars ? ` · ${'★'.repeat(form.hotelStars)}` : ''}${form.hotelAddress ? ` — ${form.hotelAddress}` : ''}`} />
              ) : null}
              {form.includes.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 border-b border-default/50 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>Incluye</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.includes.map((item, i) => (
                      <span key={i} className='px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400'>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {form.notIncludes.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>No incluye</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.notIncludes.map((item, i) => (
                      <span key={i} className='px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-medium dark:bg-rose-900/30 dark:text-rose-400'>{item}</span>
                    ))}
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

            <FieldGroup title='Publicación'>
              <div className='grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start'>
                <div>
                  <FL>Estado</FL>
                  <HeroSelect
                    value={form.status}
                    onValueChange={(v) => update('status', v)}
                    options={opcionesEstado}
                    triggerClassName={`h-11 rounded-xl border bg-surface transition-colors ${showErrors && !form.status ? 'border-rose-400' : 'border-default hover:border-muted/50'}`}
                  />
                  <FError>{showErrors && !form.status ? 'Selecciona un estado.' : null}</FError>
                </div>
                <div className='space-y-3 md:pt-6'>
                  <CheckPill label='Marcar como oferta destacada' checked={form.featured} onChange={(v) => update('featured', v)} />
                  <div className='flex items-center gap-2'>
                    <CheckPill
                      label='Marcar como oferta especial'
                      checked={form.isSpecialOffer}
                      onChange={(v) => update('isSpecialOffer', v)}
                    />
                    <Tooltip>
                      <Tooltip.Trigger>
                        <button type='button' className='text-muted/40 hover:text-muted transition-colors'>
                          <Info size={14} />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Content>
                        <p className='text-xs max-w-[220px]'>Solo puede haber una a la vez. Marcar esta opción desactivará la oferta especial anterior.</p>
                      </Tooltip.Content>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </FieldGroup>
          </div>
        )}

        {/* Navegación */}
        <div className='pt-5 border-t border-default flex items-center justify-between gap-4'>
          <button
            type='button'
            onClick={goBack}
            disabled={paso === 1 || guardando}
            className='h-11 px-6 rounded-xl border border-default bg-surface hover:bg-surface-secondary disabled:opacity-30 text-sm font-semibold text-foreground transition-all disabled:cursor-not-allowed'
          >
            ← Atrás
          </button>
          <span className='text-xs text-muted font-medium hidden sm:block'>Paso {paso} de {pasos.length}</span>
          {paso < 4 ? (
            <Button
              type='button'
              onClick={tryGoNext}
              className='h-11 px-6 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              type='button'
              isPending={guardando}
              onClick={guardarOferta}
              className='h-11 px-6 rounded-xl bg-accent text-accent-foreground font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color='current' size='sm' />}
                  {isPending ? 'Publicando...' : 'Publicar oferta'}
                </>
              )}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
