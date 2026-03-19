'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Checkbox, NumberField, Spinner } from '@heroui/react';
import { Check, Minus, Plus } from 'lucide-react';
import { toastError } from '@/lib/toast';
import HeroSelect from '@/components/ui/hero-select';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';

/* ─── Opciones estáticas ─────────────────────────────────────────────── */

const pasos = [
  { id: 1, label: 'Identidad' },
  { id: 2, label: 'Viaje y clima' },
  { id: 3, label: 'Contenido' },
  { id: 4, label: 'Revisión' },
];

const opcionesContinente = [
  { value: 'América', label: 'América' },
  { value: 'Europa', label: 'Europa' },
  { value: 'Asia', label: 'Asia' },
  { value: 'África', label: 'África' },
  { value: 'Oceanía', label: 'Oceanía' },
];

const opcionesMoneda = [
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'PEN', label: 'PEN — Sol peruano' },
];

const opcionesEstado = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
];

/* ─── Estado inicial ─────────────────────────────────────────────────── */

const initialForm = {
  name: '',
  slug: '',
  country: '',
  continent: '',
  featuredImage: '',
  gallery: '',
  airport: '',
  language: '',
  currency: '',
  timezone: '',
  recommendedStayDays: null,
  climateType: '',
  averageTemperatureC: null,
  bestMonthsToVisit: '',
  description: '',
  shortDescription: '',
  highlights: [],
  travelStyles: [],
  annualVisitorsMillions: null,
  safetyIndex: null,
  averageDailyBudgetUSD: null,
  metaTitle: '',
  metaDescription: '',
  isPopular: false,
  isFeatured: false,
  isRecommended: false,
  status: 'draft',
};

/* ─── Componentes visuales ───────────────────────────────────────────── */

function StepperBar({ pasos, paso, maxStep, onGoToStep }) {
  return (
    <div className='flex items-start gap-0'>
      {pasos.map((step, i) => {
        const active = step.id === paso;
        const done = step.id < paso;
        const locked = step.id > maxStep;
        return (
          <div key={step.id} className='flex items-start flex-1 min-w-0'>
            <div className='flex flex-col items-center min-w-0 flex-1'>
              <button
                type='button'
                onClick={() => !locked && onGoToStep(step.id)}
                disabled={locked}
                className='flex flex-col items-center gap-2 group disabled:cursor-not-allowed'
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                  active
                    ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-110'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-secondary border-2 border-default text-muted/50'
                }`}>
                  {done ? <Check size={15} strokeWidth={2.5} /> : step.id}
                </div>
                <span className={`text-[10px] uppercase tracking-[0.12em] font-bold whitespace-nowrap transition-colors ${
                  active ? 'text-accent' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted/60'
                }`}>
                  {step.label}
                </span>
              </button>
            </div>
            {i < pasos.length - 1 && (
              <div className='flex-1 flex items-start pt-[18px] px-1'>
                <div className={`h-[2px] w-full rounded-full transition-colors duration-300 ${
                  paso > step.id ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-border'
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
      className={`h-11 px-3.5 rounded-xl border w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all ${
        error ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-default hover:border-muted/50'
      } ${className}`}
      {...props}
    />
  );
}

function FError({ children }) {
  if (!children) return null;
  return <p className='text-xs text-rose-500 mt-1 flex items-center gap-1'>⚠ {children}</p>;
}

function NumField({ label, value, onChange, min = 0, max, withButtons = false, formatOptions }) {
  return (
    <div className='space-y-1.5'>
      <FL>{label}</FL>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        maxValue={max}
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
      {note && <p className='text-xs text-muted mt-0.5 ml-6'>{note}</p>}
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

const DRAFT_KEY = 'admin_nuevo_destino_draft';

/* ─── Página principal ───────────────────────────────────────────────── */

export default function AdminNewDestinationPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showErrors, setShowErrors] = useState(false);

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

  const canGoNext = useMemo(() => {
    if (paso === 1) return Boolean(form.name && form.country);
    if (paso === 2) return Boolean(form.airport && form.language);
    if (paso === 3) return Boolean(form.description && form.shortDescription);
    return true;
  }, [form, paso]);

  async function guardarDestino() {
    setGuardando(true);
    try {
      const res = await fetch('/api/destinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar el destino.');
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
      router.push('/admin/destinos');
      router.refresh();
    } catch (err) {
      toastError(err, 'No se pudo guardar el destino');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className='space-y-8 max-w-4xl'>
      {/* Encabezado */}
      <section>
        <p className='text-[10px] uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
          <Link href='/admin/destinos' className='hover:text-accent transition-colors'>Destinos</Link>
          <span className='mx-1.5 opacity-40'>·</span>Nuevo
        </p>
        <h2 className='text-3xl font-bold tracking-tight'>Nuevo destino</h2>
        <p className='text-sm text-muted mt-1'>Completa los datos para publicar un destino turístico.</p>
      </section>

      {/* Stepper */}
      <StepperBar pasos={pasos} paso={paso} maxStep={maxStep} onGoToStep={goToStep} />

      {/* Contenido del paso */}
      <section className='rounded-2xl border border-default bg-surface p-6 md:p-8 space-y-6'>

        {/* ── PASO 1: Identidad ─────────────────────────────── */}
        {paso === 1 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Identidad del destino</h3>
              <p className='text-sm text-muted mt-0.5'>Nombre, país y datos de identificación.</p>
            </div>

            <Panel title='Nombre'>
              <div>
                <FInput
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder='Ej: Patagonia Argentina'
                  error={showErrors && !form.name}
                  className='text-base h-12 font-medium'
                />
                <FError>{showErrors && !form.name ? 'El nombre es obligatorio.' : null}</FError>
              </div>
            </Panel>

            <Panel title='Ubicación'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <FL>País *</FL>
                  <CountryCombobox value={form.country} onChange={(v) => update('country', v)} placeholder='Seleccionar país...' />
                  <FError>{showErrors && !form.country ? 'El país es obligatorio.' : null}</FError>
                </div>
                <div>
                  <FL>Continente</FL>
                  <HeroSelect
                    value={form.continent}
                    onValueChange={(v) => update('continent', v)}
                    options={opcionesContinente}
                    triggerClassName='h-11 rounded-xl border border-default bg-surface hover:border-muted/50 transition-colors'
                  />
                </div>
                <div>
                  <FL>Slug (se genera automáticamente)</FL>
                  <FInput value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder='patagonia-argentina' className='font-mono text-xs' />
                </div>
              </div>
            </Panel>

            <Panel title='Imagen destacada'>
              <CoverImageInput value={form.featuredImage} onChange={(url) => update('featuredImage', url)} />
            </Panel>
          </div>
        )}

        {/* ── PASO 2: Viaje y clima ─────────────────────────── */}
        {paso === 2 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Viaje y clima</h3>
              <p className='text-sm text-muted mt-0.5'>Información práctica para el viajero.</p>
            </div>

            <Panel title='Información de viaje'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <FL>Aeropuerto IATA *</FL>
                  <FInput
                    value={form.airport}
                    onChange={(e) => update('airport', e.target.value)}
                    placeholder='EZE'
                    error={showErrors && !form.airport}
                    className='font-mono'
                  />
                  <FError>{showErrors && !form.airport ? 'El código IATA es obligatorio.' : null}</FError>
                </div>
                <div>
                  <FL>Idioma *</FL>
                  <FInput
                    value={form.language}
                    onChange={(e) => update('language', e.target.value)}
                    placeholder='Español'
                    error={showErrors && !form.language}
                  />
                  <FError>{showErrors && !form.language ? 'El idioma es obligatorio.' : null}</FError>
                </div>
                <div>
                  <FL>Moneda</FL>
                  <HeroSelect
                    value={form.currency}
                    onValueChange={(v) => update('currency', v)}
                    options={opcionesMoneda}
                    triggerClassName='h-11 rounded-xl border border-default bg-surface hover:border-muted/50 transition-colors'
                  />
                </div>
                <div>
                  <FL>Zona horaria</FL>
                  <FInput value={form.timezone} onChange={(e) => update('timezone', e.target.value)} placeholder='America/Argentina/Buenos_Aires' />
                </div>
                <NumField label='Estadía recomendada (días)' value={form.recommendedStayDays} onChange={(v) => update('recommendedStayDays', v ?? 1)} min={1} withButtons />
              </div>
            </Panel>

            <Panel title='Clima'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <FL>Tipo de clima</FL>
                  <FInput value={form.climateType} onChange={(e) => update('climateType', e.target.value)} placeholder='Templado, Tropical...' />
                </div>
                <NumField
                  label='Temperatura promedio (°C)'
                  value={form.averageTemperatureC}
                  onChange={(v) => update('averageTemperatureC', v ?? 20)}
                  min={-50}
                  max={60}
                  formatOptions={{ maximumFractionDigits: 1, useGrouping: false }}
                />
                <div>
                  <FL>Mejores meses (separados por coma)</FL>
                  <FInput value={form.bestMonthsToVisit} onChange={(e) => update('bestMonthsToVisit', e.target.value)} placeholder='Enero, Febrero, Marzo' />
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* ── PASO 3: Contenido ─────────────────────────────── */}
        {paso === 3 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Contenido editorial</h3>
              <p className='text-sm text-muted mt-0.5'>Textos, highlights y galería.</p>
            </div>

            <Panel title='Descripciones'>
              <div className='space-y-4'>
                <div>
                  <FL>Descripción larga *</FL>
                  <textarea
                    className={`min-h-28 px-3.5 py-3 rounded-xl border w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 resize-y hover:border-muted/50 transition-all ${showErrors && !form.description ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-default'}`}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder='Descripción completa del destino...'
                  />
                  <FError>{showErrors && !form.description ? 'La descripción es obligatoria.' : null}</FError>
                </div>
                <div>
                  <FL>Descripción corta *</FL>
                  <textarea
                    className={`min-h-20 px-3.5 py-3 rounded-xl border w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 resize-y hover:border-muted/50 transition-all ${showErrors && !form.shortDescription ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-default'}`}
                    value={form.shortDescription}
                    onChange={(e) => update('shortDescription', e.target.value)}
                    placeholder='Descripción breve que aparece en la tarjeta...'
                  />
                  <FError>{showErrors && !form.shortDescription ? 'La descripción corta es obligatoria.' : null}</FError>
                </div>
              </div>
            </Panel>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Panel title='Highlights'>
                <ItemListInput label='' items={form.highlights} onChange={(v) => update('highlights', v)} placeholder='Ej: Tours guiados, Gastronomía local...' />
              </Panel>
              <Panel title='Estilos de viaje'>
                <ItemListInput label='' items={form.travelStyles} onChange={(v) => update('travelStyles', v)} placeholder='Ej: Cultural, Naturaleza...' />
              </Panel>
            </div>

            <Panel title='Galería de imágenes'>
              <p className='text-xs text-muted -mt-1'>Imágenes adicionales del destino.</p>
              <GalleryEditor
                images={form.gallery ? form.gallery.split('\n').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(arr) => update('gallery', arr.join('\n'))}
              />
            </Panel>
          </div>
        )}

        {/* ── PASO 4: Revisión ──────────────────────────────── */}
        {paso === 4 && (
          <div className='space-y-5'>
            <div>
              <h3 className='text-lg font-bold'>Revisión y publicación</h3>
              <p className='text-sm text-muted mt-0.5'>Revisa los datos antes de publicar.</p>
            </div>

            <div className='rounded-2xl border border-default bg-surface-secondary/50 overflow-hidden'>
              <ReviewRow label='Nombre' value={form.name || '—'} />
              <ReviewRow label='País' value={`${form.country || '—'} · ${form.continent}`} />
              <ReviewRow label='Aeropuerto' value={form.airport || '—'} />
              <ReviewRow label='Idioma' value={form.language || '—'} />
              <ReviewRow label='Moneda' value={form.currency} />
              <ReviewRow label='Estadía' value={`${form.recommendedStayDays} días`} />
              {form.climateType && <ReviewRow label='Clima' value={form.climateType} />}
              {form.bestMonthsToVisit && <ReviewRow label='Mejores meses' value={form.bestMonthsToVisit} />}
              {form.highlights.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 border-b border-default/50 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>Highlights</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.highlights.map((item, i) => (
                      <span key={i} className='px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400'>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {form.travelStyles.length > 0 && (
                <div className='flex gap-4 py-2.5 px-4 flex-wrap'>
                  <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>Estilos</span>
                  <div className='flex flex-wrap gap-1.5 flex-1'>
                    {form.travelStyles.map((item, i) => (
                      <span key={i} className='px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-medium dark:bg-sky-900/30 dark:text-sky-400'>{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {form.isRecommended && (
              <div className='rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2'>
                <span className='text-base leading-none mt-0.5'>⚠</span>
                <span>Este destino será marcado como recomendado. El anterior será desactivado automáticamente.</span>
              </div>
            )}

            <Panel title='Publicación'>
              <div className='grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start'>
                <div>
                  <FL>Estado</FL>
                  <HeroSelect
                    value={form.status}
                    onValueChange={(v) => update('status', v)}
                    options={opcionesEstado}
                    triggerClassName='h-11 rounded-xl border border-default bg-surface hover:border-muted/50 transition-colors'
                  />
                </div>
                <div className='space-y-3 md:pt-6'>
                  <CheckPill label='Marcar como destino popular' checked={form.isPopular} onChange={(v) => update('isPopular', v)} />
                  <CheckPill label='Marcar como destino destacado' checked={form.isFeatured} onChange={(v) => update('isFeatured', v)} />
                  <CheckPill
                    label='Marcar como destino recomendado'
                    checked={form.isRecommended}
                    onChange={(v) => update('isRecommended', v)}
                    note='Solo puede haber uno a la vez. Marcar aquí desactivará el anterior.'
                  />
                </div>
              </div>
            </Panel>
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
              className='h-11 px-6 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              type='button'
              isPending={guardando}
              onClick={guardarDestino}
              className='h-11 px-6 rounded-xl bg-accent text-white font-semibold text-sm shadow-sm shadow-accent/20 hover:bg-orange-500 transition-all'
            >
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color='current' size='sm' />}
                  {isPending ? 'Publicando...' : 'Publicar destino'}
                </>
              )}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
