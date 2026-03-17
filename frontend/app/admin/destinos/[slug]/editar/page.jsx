'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Checkbox, NumberField, Spinner } from '@heroui/react';
import { Minus, Plus } from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toast';
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

/* ─── Estado inicial y conversor ─────────────────────────────────────── */

const initialForm = {
  name: '', slug: '', country: '', continent: 'América',
  featuredImage: '', gallery: '',
  airport: '', language: '', currency: 'USD', timezone: '',
  recommendedStayDays: 7,
  climateType: '', averageTemperatureC: 20, bestMonthsToVisit: '',
  description: '', shortDescription: '',
  highlights: [], travelStyles: [],
  annualVisitorsMillions: 3, safetyIndex: 75, averageDailyBudgetUSD: 120,
  metaTitle: '', metaDescription: '',
  isPopular: true, isFeatured: false, isRecommended: false, status: 'draft',
};

function destinationToForm(d) {
  return {
    name: d.name || '',
    slug: d.slug || '',
    country: d.country || '',
    continent: d.continent || 'América',
    featuredImage: d.featuredImage || '',
    gallery: Array.isArray(d.gallery) ? d.gallery.join('\n') : d.gallery || '',
    airport: d.travelInfo?.airport || '',
    language: d.travelInfo?.language || '',
    currency: d.travelInfo?.currency || 'USD',
    timezone: d.travelInfo?.timezone || '',
    recommendedStayDays: d.travelInfo?.recommendedStayDays || 7,
    climateType: d.climate?.type || '',
    averageTemperatureC: d.climate?.averageTemperatureC ?? 20,
    bestMonthsToVisit: Array.isArray(d.climate?.bestMonthsToVisit)
      ? d.climate.bestMonthsToVisit.join(', ')
      : d.climate?.bestMonthsToVisit || '',
    description: d.description || '',
    shortDescription: d.shortDescription || '',
    highlights: Array.isArray(d.highlights) ? d.highlights : [],
    travelStyles: Array.isArray(d.travelStyles) ? d.travelStyles : [],
    annualVisitorsMillions: d.stats?.annualVisitorsMillions ?? 3,
    safetyIndex: d.stats?.safetyIndex ?? 75,
    averageDailyBudgetUSD: d.stats?.averageDailyBudgetUSD ?? 120,
    metaTitle: d.seo?.metaTitle || '',
    metaDescription: d.seo?.metaDescription || '',
    isPopular: d.isPopular ?? true,
    isFeatured: d.isFeatured ?? false,
    isRecommended: d.isRecommended ?? false,
    status: d.status || 'draft',
  };
}

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

function NumField({ label, value, onChange, min = 0, max, withButtons = false, formatOptions }) {
  return (
    <Field label={label}>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        maxValue={max}
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

function CheckField({ label, checked, onChange }) {
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

/* ─── Página principal ───────────────────────────────────────────────── */

export default function EditDestinationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [destId, setDestId] = useState(null);
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
    fetch(`/api/destinos/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) {
          setDestId(d.id);
          setForm(destinationToForm(d));
        }
      })
      .catch(() => toastError('No se pudo cargar el destino.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const goBack = () => { setShowErrors(false); setPaso((p) => Math.max(1, p - 1)); };

  const canGoNext = useMemo(() => {
    if (paso === 1) return Boolean(form.name && form.country);
    if (paso === 2) return Boolean(form.airport && form.language);
    if (paso === 3) return Boolean(form.description && form.shortDescription);
    return true;
  }, [form, paso]);

  function tryGoNext() {
    if (!canGoNext) { setShowErrors(true); return; }
    setShowErrors(false);
    setPaso((p) => Math.min(4, p + 1));
  }

  async function guardarDestino() {
    if (!destId) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/destinos/${destId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar el destino.');
      toastSuccess('Destino actualizado correctamente');
      router.push('/admin/destinos');
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
      <DesignerMediaViewDestino
        slug={slug}
        destId={destId}
        form={form}
        update={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
      />
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Encabezado */}
      <section className='flex flex-col md:flex-row md:items-start md:justify-between gap-3'>
        <div>
          <p className='text-sm text-muted mb-1'>
            <Link href='/admin/destinos' className='hover:underline'>Destinos</Link> / Editar
          </p>
          <h2 className='text-4xl font-bold'>Editar destino</h2>
          <p className='text-xs text-muted font-mono mt-1'>{slug}</p>
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
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
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

        {/* ── PASO 1: Identidad ─────────────────────────────── */}
        {paso === 1 && (
          <div className='space-y-5'>
            <SectionTitle>Identidad del destino</SectionTitle>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Field label='Nombre *' className='md:col-span-2'>
                <input
                  className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
                {showErrors && !form.name && <p className='text-xs text-rose-500 mt-1'>El nombre es obligatorio.</p>}
              </Field>

              <Field label='País *'>
                <CountryCombobox value={form.country} onChange={(v) => update('country', v)} placeholder='Seleccionar país...' />
                {showErrors && !form.country && <p className='text-xs text-rose-500 mt-1'>El país es obligatorio.</p>}
              </Field>

              <Field label='Continente'>
                <HeroSelect
                  value={form.continent}
                  onValueChange={(v) => update('continent', v)}
                  options={opcionesContinente}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
              </Field>

              <Field label='Slug'>
                <input
                  className='h-10 px-3 rounded-lg border border-default w-full text-sm font-mono bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value)}
                  readOnly
                />
              </Field>

              <Field label='Imagen destacada'>
                <CoverImageInput value={form.featuredImage} onChange={(url) => update('featuredImage', url)} />
              </Field>
            </div>
          </div>
        )}

        {/* ── PASO 2: Viaje y clima ─────────────────────────── */}
        {paso === 2 && (
          <div className='space-y-6'>
            <SectionTitle>Viaje y clima</SectionTitle>

            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Información de viaje</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Field label='Aeropuerto (IATA) *'>
                  <input
                    className={`h-10 px-3 rounded-lg border w-full text-sm font-mono bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.airport ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                    value={form.airport}
                    onChange={(e) => update('airport', e.target.value)}
                  />
                  {showErrors && !form.airport && <p className='text-xs text-rose-500 mt-1'>El código IATA es obligatorio.</p>}
                </Field>

                <Field label='Idioma *'>
                  <input
                    className={`h-10 px-3 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent ${showErrors && !form.language ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                    value={form.language}
                    onChange={(e) => update('language', e.target.value)}
                  />
                  {showErrors && !form.language && <p className='text-xs text-rose-500 mt-1'>El idioma es obligatorio.</p>}
                </Field>

                <Field label='Moneda'>
                  <HeroSelect
                    value={form.currency}
                    onValueChange={(v) => update('currency', v)}
                    options={opcionesMoneda}
                    triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                  />
                </Field>

                <Field label='Zona horaria'>
                  <input
                    className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                    value={form.timezone}
                    onChange={(e) => update('timezone', e.target.value)}
                  />
                </Field>

                <NumField
                  label='Estadía recomendada (días)'
                  value={form.recommendedStayDays}
                  onChange={(v) => update('recommendedStayDays', v ?? 1)}
                  min={1}
                  withButtons
                />
              </div>
            </div>

            <div>
              <p className='text-sm font-semibold text-muted uppercase tracking-wide mb-3'>Clima</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Field label='Tipo de clima'>
                  <input
                    className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                    value={form.climateType}
                    onChange={(e) => update('climateType', e.target.value)}
                  />
                </Field>

                <NumField
                  label='Temperatura promedio (°C)'
                  value={form.averageTemperatureC}
                  onChange={(v) => update('averageTemperatureC', v ?? 20)}
                  min={-50}
                  max={60}
                  formatOptions={{ maximumFractionDigits: 1, useGrouping: false }}
                />

                <Field label='Mejores meses (separados por coma)'>
                  <input
                    className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
                    value={form.bestMonthsToVisit}
                    onChange={(e) => update('bestMonthsToVisit', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: Contenido ─────────────────────────────── */}
        {paso === 3 && (
          <div className='space-y-6'>
            <SectionTitle>Contenido editorial</SectionTitle>

            <Field label='Descripción larga *'>
              <textarea
                className={`min-h-28 px-3 py-2 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-y ${showErrors && !form.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              {showErrors && !form.description && <p className='text-xs text-rose-500 mt-1'>La descripción es obligatoria.</p>}
            </Field>

            <Field label='Descripción corta *'>
              <textarea
                className={`min-h-20 px-3 py-2 rounded-lg border w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-y ${showErrors && !form.shortDescription ? 'border-rose-500 ring-1 ring-rose-500' : 'border-default'}`}
                value={form.shortDescription}
                onChange={(e) => update('shortDescription', e.target.value)}
              />
              {showErrors && !form.shortDescription && <p className='text-xs text-rose-500 mt-1'>La descripción corta es obligatoria.</p>}
            </Field>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <ItemListInput
                label='Highlights'
                items={form.highlights}
                onChange={(v) => update('highlights', v)}
                placeholder='Ej: Tours guiados...'
              />
              <ItemListInput
                label='Estilos de viaje'
                items={form.travelStyles}
                onChange={(v) => update('travelStyles', v)}
                placeholder='Ej: Cultural, Naturaleza...'
              />
            </div>

            <Field label='Galería de imágenes'>
              <p className='text-xs text-muted mb-2'>Imágenes adicionales que se muestran en la página del destino.</p>
              <GalleryEditor
                images={form.gallery ? form.gallery.split('\n').map((s) => s.trim()).filter(Boolean) : []}
                onChange={(arr) => update('gallery', arr.join('\n'))}
              />
            </Field>
          </div>
        )}

        {/* ── PASO 4: Revisión ──────────────────────────────── */}
        {paso === 4 && (
          <div className='space-y-5'>
            <SectionTitle>Revisión</SectionTitle>

            <div className='rounded-xl border border-default bg-surface-secondary divide-y divide-default overflow-hidden text-sm'>
              <ReviewRow label='Nombre' value={form.name || '—'} />
              <ReviewRow label='País' value={`${form.country || '—'} · ${form.continent}`} />
              <ReviewRow label='Aeropuerto' value={form.airport || '—'} />
              <ReviewRow label='Idioma' value={form.language || '—'} />
              <ReviewRow label='Moneda' value={form.currency} />
              <ReviewRow label='Estadía' value={`${form.recommendedStayDays} días`} />
              {form.climateType && <ReviewRow label='Clima' value={form.climateType} />}
              {form.bestMonthsToVisit && <ReviewRow label='Mejores meses' value={form.bestMonthsToVisit} />}
              {form.highlights.length > 0 && (
                <div className='px-4 py-3 flex gap-6'>
                  <span className='text-muted w-32 shrink-0'>Highlights</span>
                  <ul className='flex flex-wrap gap-1.5 flex-1'>
                    {form.highlights.map((item, i) => (
                      <li key={i} className='px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/30 dark:text-emerald-400'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {form.travelStyles.length > 0 && (
                <div className='px-4 py-3 flex gap-6'>
                  <span className='text-muted w-32 shrink-0'>Estilos</span>
                  <ul className='flex flex-wrap gap-1.5 flex-1'>
                    {form.travelStyles.map((item, i) => (
                      <li key={i} className='px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400'>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {form.isRecommended && (
              <div className='rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2 text-sm text-amber-700 dark:text-amber-300'>
                Este destino será marcado como recomendado (el anterior será desactivado automáticamente).
              </div>
            )}

            <div className='flex items-center gap-4'>
              <Field label='Estado'>
                <HeroSelect
                  value={form.status}
                  onValueChange={(v) => update('status', v)}
                  options={opcionesEstado}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary w-48'
                />
              </Field>
              <div className='flex flex-wrap gap-5 pt-5'>
                <CheckField label='Destino popular' checked={form.isPopular} onChange={(v) => update('isPopular', v)} />
                <CheckField label='Destino destacado' checked={form.isFeatured} onChange={(v) => update('isFeatured', v)} />
                <div className='space-y-0.5'>
                  <CheckField label='Destino recomendado' checked={form.isRecommended} onChange={(v) => update('isRecommended', v)} />
                  <p className='text-xs text-muted ml-7'>Solo puede haber uno a la vez. Marcar aquí desactivará el anterior.</p>
                </div>
              </div>
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
              className='h-10 px-5 rounded-lg bg-accent text-white font-semibold text-sm'
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              type='button'
              isPending={guardando}
              onClick={guardarDestino}
              className='h-10 px-5 bg-accent text-white font-semibold text-sm'
            >
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

/* ─── Vista multimedia para diseñadores ─────────────────────────────── */

function DesignerMediaViewDestino({ slug, destId, form, update }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  // gallery como array derivado del string newline-separated del form
  const galleryArray = form.gallery
    ? form.gallery.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  function setGalleryArray(arr) {
    update('gallery', arr.join('\n'));
  }

  async function guardarImagenes() {
    if (!destId) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/destinos/${destId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          gallery: galleryArray, // enviar como array para que normalizeList lo acepte
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar.');
      toastSuccess('Imágenes actualizadas correctamente.');
      router.push('/admin/destinos');
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
          <Link href='/admin/destinos' className='hover:underline'>Destinos</Link> / Multimedia
        </p>
        <h2 className='text-4xl font-bold'>Editar multimedia</h2>
        <p className='text-muted text-sm mt-1 font-mono text-xs'>{slug}</p>
      </section>

      <div className='rounded-2xl border border-default bg-surface p-5 md:p-7 space-y-6'>
        {/* Imagen destacada */}
        <div className='space-y-2'>
          <h3 className='text-base font-semibold'>Imagen destacada (portada)</h3>
          <CoverImageInput
            value={form.featuredImage}
            onChange={(url) => update('featuredImage', url)}
          />
        </div>

        {/* Galería */}
        <div className='space-y-2'>
          <h3 className='text-base font-semibold'>Galería de imágenes</h3>
          <p className='text-sm text-muted'>Imágenes adicionales del destino.</p>
          <GalleryEditor
            images={galleryArray}
            onChange={setGalleryArray}
          />
        </div>

        <div className='pt-2 border-t border-default flex justify-end'>
          <Button
            type='button'
            isPending={guardando}
            onClick={guardarImagenes}
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
