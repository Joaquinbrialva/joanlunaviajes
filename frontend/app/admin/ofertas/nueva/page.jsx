'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Checkbox, NumberField, Spinner } from '@heroui/react';
import { Minus, Plus } from 'lucide-react';
import { toastError } from '@/lib/toast';
import HeroSelect from '@/components/ui/hero-select';
import AirlineCombobox from '@/components/ui/airline-combobox';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';

/* ─── Opciones estáticas ─────────────────────────────────────────────── */

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
  originCountry: 'Argentina',
  originCity: '',
  destinationCountry: '',
  destinationCity: '',
  destinationAirport: '',
  startDate: '',
  endDate: '',
  days: 7,
  nights: 6,
  airline: '',
  airlineIata: '',
  flightType: 'direct',
  luggagePersonal: true,
  luggageCarryOn: true,
  luggageChecked: false,
  currency: 'ARS',
  price: null,
  originalPrice: null,
  priceNote: 'por persona',
  seats: 12,
  status: 'draft',
  featured: false,
  summary: '',
  includes: ['Vuelos', 'Hotel', 'Traslados'],
  notIncludes: ['Propinas', 'Gastos personales'],
  highlights: ['Asistencia local', 'Coordinación integral', 'Experiencia curada'],
  coverImage: '',
  hotelName: '',
};

/* ─── Componentes auxiliares ─────────────────────────────────────────── */

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

const DRAFT_KEY = 'admin_nueva_oferta_draft';

/* ─── Página principal ───────────────────────────────────────────────── */

export default function AdminNewOfferPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showErrors, setShowErrors] = useState(false);

  // Cargar borrador guardado al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setForm(JSON.parse(saved));
    } catch { }
  }, []);

  // Guardar borrador en cada cambio del formulario
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

  // Calcular días y noches automáticamente cuando cambian las fechas
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
    if (paso === 2) return Boolean(form.price && form.days > 0);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la oferta.');
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
      router.push('/admin/ofertas');
      router.refresh();
    } catch (err) {
      toastError(err, 'No se pudo guardar la oferta');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Encabezado */}
      <section className='flex flex-col md:flex-row md:items-start md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Nueva oferta</h2>
          <p className='text-muted text-sm mt-1'>Completá los datos para publicar una propuesta comercial.</p>
        </div>
      </section>

      {/* Stepper */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
        {pasos.map((item) => {
          const active = item.id === paso;
          const done = item.id < paso;
          const locked = item.id > maxStep;
          return (
            <button
              key={item.id}
              type='button'
              onClick={() => goToStep(item.id)}
              disabled={locked}
              className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${active
                ? 'bg-accent text-white border-accent'
                : done
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                  : locked
                    ? 'bg-surface-secondary border-default text-muted opacity-40 cursor-not-allowed'
                    : 'bg-surface-secondary border-default text-muted'
                }`}
            >
              {done ? '✓' : item.id}. {item.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del paso */}
      <section className='rounded-2xl border border-default bg-surface p-5 md:p-7 space-y-6'>

        {/* ── PASO 1: Información general ───────────────────────── */}
        {paso === 1 && (
          <div className='space-y-5'>
            <SectionTitle>Información general</SectionTitle>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Field label='Título de la oferta *' className='md:col-span-2'>
                <input
                  className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder='Ej: Vuelos nacionales, conoce Argentina'
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
                      className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${form.tripType === op.value
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-secondary border-default hover:bg-surface-tertiary'
                        }`}
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
                  className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.customRoute ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                  value={form.customRoute}
                  onChange={(e) => update('customRoute', e.target.value)}
                  placeholder='Buenos Aires → Lima → Bogotá → Buenos Aires'
                />
                {showErrors && !form.customRoute && <p className='text-xs text-rose-500 mt-1'>La ruta es obligatoria para viajes multi-destino.</p>}
              </Field>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='País de origen'>
                  <CountryCombobox value={form.originCountry} onChange={(v) => update('originCountry', v)} placeholder='Argentina' />
                </Field>
                <Field label='Ciudad de origen'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.originCity} onChange={(e) => update('originCity', e.target.value)} placeholder='Buenos Aires' />
                </Field>
                <Field label='País de destino *'>
                  <CountryCombobox value={form.destinationCountry} onChange={(v) => update('destinationCountry', v)} placeholder='Seleccionar país destino...' />
                  {showErrors && !form.destinationCountry && <p className='text-xs text-rose-500 mt-1'>El país de destino es obligatorio.</p>}
                </Field>
                <Field label='Ciudad de destino'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} placeholder='Lima' />
                </Field>
                <Field label='Código IATA aeropuerto'>
                  <input className='h-10 px-3 rounded-lg border border-default w-full text-sm font-mono bg-surface focus:outline-none focus:ring-1 focus:ring-accent' value={form.destinationAirport} onChange={(e) => update('destinationAirport', e.target.value)} placeholder='LIM' />
                </Field>
              </div>
            )}

            <Field label='Imagen de portada (URL)'>
              <input
                className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                value={form.coverImage}
                onChange={(e) => update('coverImage', e.target.value)}
                placeholder='https://...'
              />
            </Field>
          </div>
        )}

        {/* ── PASO 2: Logística y precios ───────────────────────── */}
        {paso === 2 && (
          <div className='space-y-6'>
            <SectionTitle>Logística y precios</SectionTitle>

            {/* Fechas */}
            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Fechas del viaje</p>
              <RangeDatePickerField
                startDate={form.startDate}
                endDate={form.endDate}
                tripType={form.tripType}
                onChange={({ start, end }) =>
                  setForm((prev) => ({ ...prev, startDate: start, endDate: end }))
                }
              />
            </div>

            {/* Duración */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <p className='text-sm font-semibold text-muted uppercase tracking-wide'>Duración</p>
                {form.startDate && form.endDate && (
                  <span className='text-xs text-accent'>Calculado automáticamente · podés ajustar</span>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <NumField
                  label='Días'
                  value={form.days}
                  onChange={(v) => update('days', v ?? 1)}
                  min={1}
                  withButtons
                />
                <NumField
                  label='Noches'
                  value={form.nights}
                  onChange={(v) => update('nights', v ?? 0)}
                  min={0}
                  withButtons
                />
              </div>
            </div>

            {/* Vuelo */}
            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Vuelo</p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Field label='Aerolínea'>
                  <AirlineCombobox
                    value={form.airline}
                    iata={form.airlineIata}
                    onChange={({ name, iata }) => setForm((prev) => ({ ...prev, airline: name, airlineIata: iata }))}
                  />
                </Field>
                <Field label='Tipo de vuelo'>
                  <div className='flex gap-2'>
                    {opcionesTipoVuelo.map((op) => (
                      <button
                        key={op.value}
                        type='button'
                        onClick={() => update('flightType', op.value)}
                        className={`h-10 flex-1 rounded-lg text-sm font-medium border transition-colors ${form.flightType === op.value
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface-secondary border-default hover:bg-surface-tertiary'
                          }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Equipaje */}
              <div className='mt-4'>
                <span className='text-sm font-medium block mb-2'>Equipaje incluido</span>
                <div className='flex flex-wrap gap-4'>
                  <LuggageCheck
                    label='Artículo personal'
                    checked={form.luggagePersonal}
                    onChange={(v) => update('luggagePersonal', v)}
                  />
                  <LuggageCheck
                    label='Carry on (equipaje de mano)'
                    checked={form.luggageCarryOn}
                    onChange={(v) => update('luggageCarryOn', v)}
                  />
                  <LuggageCheck
                    label='Equipaje despachado'
                    checked={form.luggageChecked}
                    onChange={(v) => update('luggageChecked', v)}
                  />
                </div>
              </div>
            </div>

            {/* Precios */}
            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Precio</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Field label='Moneda'>
                  <HeroSelect
                    value={form.currency}
                    onValueChange={(v) => update('currency', v)}
                    options={opcionesMoneda}
                    triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                  />
                </Field>
                <div>
                  <NumField
                    label='Precio base *'
                    value={form.price}
                    onChange={(v) => update('price', v)}
                    min={0}
                    formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }}
                  />
                  {showErrors && !form.price && <p className='text-xs text-rose-500 mt-1'>El precio base es obligatorio.</p>}
                </div>
                <NumField
                  label='Precio original (tachado)'
                  value={form.originalPrice}
                  onChange={(v) => update('originalPrice', v)}
                  min={0}
                  formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }}
                />
                <Field label='Aclaración de precio'>
                  <input
                    className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                    value={form.priceNote}
                    onChange={(e) => update('priceNote', e.target.value)}
                    placeholder='por persona'
                  />
                </Field>
                <NumField
                  label='Cupos disponibles'
                  value={form.seats}
                  onChange={(v) => update('seats', v ?? 1)}
                  min={1}
                  withButtons
                />
                <Field label='Hotel'>
                  <input
                    className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                    value={form.hotelName}
                    onChange={(e) => update('hotelName', e.target.value)}
                    placeholder='Nombre del hotel (opcional)'
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: Contenido ─────────────────────────────────── */}
        {paso === 3 && (
          <div className='space-y-6'>
            <SectionTitle>Contenido</SectionTitle>

            <Field label='Resumen comercial'>
              <textarea
                className='min-h-24 px-3 py-2 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-y'
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                placeholder='Descripción breve que aparece en la tarjeta de oferta...'
              />
            </Field>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <ItemListInput
                label='¿Qué incluye?'
                items={form.includes}
                onChange={(v) => update('includes', v)}
                placeholder='Ej: Vuelos, Hotel, Traslados...'
              />
              <ItemListInput
                label='¿Qué no incluye?'
                items={form.notIncludes}
                onChange={(v) => update('notIncludes', v)}
                placeholder='Ej: Propinas, Gastos personales...'
              />
            </div>

            <ItemListInput
              label='Highlights (puntos clave)'
              items={form.highlights}
              onChange={(v) => update('highlights', v)}
              placeholder='Ej: Asistencia local, Coordinación integral...'
            />
          </div>
        )}

        {/* ── PASO 4: Revisión ──────────────────────────────────── */}
        {paso === 4 && (
          <div className='space-y-5'>
            <SectionTitle>Revisión y publicación</SectionTitle>

            <div className='rounded-xl border border-default bg-surface-secondary divide-y divide-default overflow-hidden text-sm'>
              <ReviewRow label='Título' value={form.title || '—'} />
              <ReviewRow label='Ruta' value={buildRouteLabel(form)} />
              <div className='px-4 py-3 flex gap-6'>
                <span className='text-muted w-32 shrink-0'>Aerolínea</span>
                <span className='flex items-center gap-2 flex-1'>
                  {form.airlineIata && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://content.airhex.com/content/logos/airlines_${form.airlineIata}_50_50_s.png`}
                      alt={form.airline}
                      className='h-5 w-8 object-contain'
                    />
                  )}
                  {form.airline || '—'} · {form.flightType === 'direct' ? 'Vuelo directo' : 'Con escala'}
                </span>
              </div>
              <ReviewRow
                label='Equipaje'
                value={
                  [
                    form.luggagePersonal && 'Artículo personal',
                    form.luggageCarryOn && 'Carry on',
                    form.luggageChecked && 'Despachado',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Sin especificar'
                }
              />
              <ReviewRow label='Salida' value={form.startDate || '—'} />
              <ReviewRow label='Regreso' value={form.endDate || '—'} />
              <ReviewRow label='Duración' value={`${form.days} días / ${form.nights} noches`} />
              <ReviewRow
                label='Precio'
                value={`${formatPrice(form.price, form.currency)}${form.priceNote ? ` ${form.priceNote}` : ''}`}
              />
              {form.originalPrice ? (
                <ReviewRow label='Precio original' value={formatPrice(form.originalPrice, form.currency)} />
              ) : null}
              {form.hotelName ? <ReviewRow label='Hotel' value={form.hotelName} /> : null}
              {form.includes.length > 0 && (
                <div className='px-4 py-3 flex gap-6'>
                  <span className='text-muted w-32 shrink-0'>Incluye</span>
                  <ul className='flex flex-wrap gap-1.5 flex-1'>
                    {form.includes.map((item, i) => (
                      <li key={i} className='px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/30 dark:text-emerald-400'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {form.notIncludes.length > 0 && (
                <div className='px-4 py-3 flex gap-6'>
                  <span className='text-muted w-32 shrink-0'>No incluye</span>
                  <ul className='flex flex-wrap gap-1.5 flex-1'>
                    {form.notIncludes.map((item, i) => (
                      <li key={i} className='px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs dark:bg-rose-900/30 dark:text-rose-400'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center pt-1'>
              <Field label='Estado de publicación'>
                <HeroSelect
                  value={form.status}
                  onValueChange={(v) => update('status', v)}
                  options={opcionesEstado}
                  triggerClassName={`h-10 rounded-lg border bg-surface-secondary ${showErrors && !form.status ? 'border-rose-500' : 'border-default'}`}
                />
                {showErrors && !form.status && <p className='text-xs text-rose-500 mt-1'>Seleccioná un estado.</p>}
              </Field>
              <LuggageCheck
                label='Marcar como oferta destacada'
                checked={form.featured}
                onChange={(v) => update('featured', v)}
              />
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className='pt-4 border-t border-default flex items-center justify-between'>
          <Button
            type='button'
            onClick={goBack}
            disabled={paso === 1 || guardando}
            className='h-10 px-5 rounded-lg border border-default bg-surface hover:bg-surface-secondary disabled:opacity-40 text-sm font-medium text-foreground transition-colors'
          >
            Atrás
          </Button>
          <span className='text-xs text-muted'>Paso {paso} de {pasos.length}</span>
          {paso < 4 ? (
            <Button
              type='button'
              onClick={tryGoNext}
              className='h-10 px-5 rounded-lg bg-accent text-white font-semibold text-sm transition-opacity'
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              type='button'
              isPending={guardando}
              onClick={guardarOferta}
              className='h-10 px-5 bg-accent text-white font-semibold text-sm'
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color='current' size='sm' />}
                  {isPending ? 'Publicando' : 'Publicar oferta'}
                </>
              )}
            </Button>
          )}
        </div>
      </section>

    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className='px-4 py-3 flex gap-6'>
      <span className='text-muted w-32  shrink-0'>{label}</span>
      <span className='flex-1'>{value}</span>
    </div>
  );
}
