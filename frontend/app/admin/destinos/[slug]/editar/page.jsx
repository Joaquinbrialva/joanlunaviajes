'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Spinner } from '@heroui/react';
import { toastError, toastSuccess } from '@/lib/toast';
import HeroSelect from '@/components/ui/hero-select';

const pasos = [
  { id: 1, label: 'Identidad' },
  { id: 2, label: 'Viaje y clima' },
  { id: 3, label: 'Contenido y media' },
  { id: 4, label: 'SEO y publicación' },
];

const opcionesContinente = [
  { value: 'América', label: 'América' },
  { value: 'Europa', label: 'Europa' },
  { value: 'Asia', label: 'Asia' },
  { value: 'África', label: 'África' },
  { value: 'Oceanía', label: 'Oceanía' },
];

const opcionesMoneda = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'ARS', label: 'ARS' },
  { value: 'PEN', label: 'PEN' },
];

const opcionesEstado = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
];

const initialForm = {
  name: '', slug: '', country: '', continent: 'América',
  description: '', shortDescription: '', airport: '',
  currency: 'USD', language: '', timezone: '', visaRequired: false,
  recommendedStayDays: 7, climateType: '', averageTemperatureC: 20,
  bestMonthsToVisit: '', highlights: '', travelStyles: '',
  featuredImage: '', gallery: '',
  annualVisitorsMillions: 3, safetyIndex: 75, averageDailyBudgetUSD: 120,
  metaTitle: '', metaDescription: '',
  isPopular: true, isFeatured: false, status: 'draft',
};

function destinationToForm(d) {
  return {
    name: d.name || '',
    slug: d.slug || '',
    country: d.country || '',
    continent: d.continent || 'América',
    description: d.description || '',
    shortDescription: d.shortDescription || '',
    airport: d.travelInfo?.airport || '',
    currency: d.travelInfo?.currency || 'USD',
    language: d.travelInfo?.language || '',
    timezone: d.travelInfo?.timezone || '',
    visaRequired: d.travelInfo?.visaRequired || false,
    recommendedStayDays: d.travelInfo?.recommendedStayDays || 7,
    climateType: d.climate?.type || '',
    averageTemperatureC: d.climate?.averageTemperatureC ?? 20,
    bestMonthsToVisit: Array.isArray(d.climate?.bestMonthsToVisit)
      ? d.climate.bestMonthsToVisit.join(', ')
      : d.climate?.bestMonthsToVisit || '',
    highlights: Array.isArray(d.highlights) ? d.highlights.join('\n') : d.highlights || '',
    travelStyles: Array.isArray(d.travelStyles) ? d.travelStyles.join('\n') : d.travelStyles || '',
    featuredImage: d.featuredImage || '',
    gallery: Array.isArray(d.gallery) ? d.gallery.join('\n') : d.gallery || '',
    annualVisitorsMillions: d.stats?.annualVisitorsMillions ?? 3,
    safetyIndex: d.stats?.safetyIndex ?? 75,
    averageDailyBudgetUSD: d.stats?.averageDailyBudgetUSD ?? 120,
    metaTitle: d.seo?.metaTitle || '',
    metaDescription: d.seo?.metaDescription || '',
    isPopular: d.isPopular ?? true,
    isFeatured: d.isFeatured ?? false,
    status: d.status || 'draft',
  };
}

function Field({ label, children }) {
  return (
    <label className='space-y-1 block'>
      <span className='text-sm font-medium'>{label}</span>
      {children}
    </label>
  );
}

export default function EditDestinationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [destId, setDestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);

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

  const canGoNext = useMemo(() => {
    if (paso === 1) return Boolean(form.name && form.country);
    if (paso === 2) return Boolean(form.airport && form.language);
    if (paso === 3) return Boolean(form.description && form.shortDescription);
    return true;
  }, [form, paso]);

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

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <p className='text-sm text-muted mb-1'>
            <Link href='/admin/destinos' className='hover:underline'>Destinos</Link> / Editar
          </p>
          <h2 className='text-4xl font-bold'>Editar destino</h2>
          <p className='text-xs text-muted font-mono mt-1'>{slug}</p>
        </div>
      </section>

      {/* Stepper */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
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

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-6 space-y-6'>

        {paso === 1 && (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold border-b border-default pb-2'>Identidad del destino</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Nombre *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.name} onChange={(e) => update('name', e.target.value)} />
              </Field>
              <Field label='Slug'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent' value={form.slug} onChange={(e) => update('slug', e.target.value)} readOnly />
              </Field>
              <Field label='País *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.country} onChange={(e) => update('country', e.target.value)} />
              </Field>
              <Field label='Continente'>
                <HeroSelect value={form.continent} onValueChange={(v) => update('continent', v)} options={opcionesContinente} triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary' />
              </Field>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold border-b border-default pb-2'>Viaje y clima</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Field label='Aeropuerto (IATA)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent' value={form.airport} onChange={(e) => update('airport', e.target.value)} />
              </Field>
              <Field label='Moneda'>
                <HeroSelect value={form.currency} onValueChange={(v) => update('currency', v)} options={opcionesMoneda} triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary' />
              </Field>
              <Field label='Idioma'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.language} onChange={(e) => update('language', e.target.value)} />
              </Field>
              <Field label='Zona horaria'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.timezone} onChange={(e) => update('timezone', e.target.value)} />
              </Field>
              <Field label='Estadía recomendada (días)'>
                <input type='number' min='1' className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.recommendedStayDays} onChange={(e) => update('recommendedStayDays', Number(e.target.value))} />
              </Field>
              <Field label='Tipo de clima'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.climateType} onChange={(e) => update('climateType', e.target.value)} />
              </Field>
              <Field label='Temperatura promedio (°C)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.averageTemperatureC} onChange={(e) => update('averageTemperatureC', Number(e.target.value))} />
              </Field>
              <Field label='Mejores meses (separados por coma)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.bestMonthsToVisit} onChange={(e) => update('bestMonthsToVisit', e.target.value)} />
              </Field>
              <Field label='¿Requiere visa?'>
                <label className='inline-flex items-center gap-2 h-10 cursor-pointer'>
                  <input type='checkbox' checked={form.visaRequired} onChange={(e) => update('visaRequired', e.target.checked)} className='accent-accent' />
                  {form.visaRequired ? 'Sí' : 'No'}
                </label>
              </Field>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold border-b border-default pb-2'>Contenido editorial y media</h3>
            <Field label='Descripción larga'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.description} onChange={(e) => update('description', e.target.value)} />
            </Field>
            <Field label='Descripción corta'>
              <textarea className='min-h-20 px-3 py-2 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Highlights (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.highlights} onChange={(e) => update('highlights', e.target.value)} />
              </Field>
              <Field label='Estilos de viaje (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.travelStyles} onChange={(e) => update('travelStyles', e.target.value)} />
              </Field>
            </div>
            <Field label='URL imagen destacada'>
              <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.featuredImage} onChange={(e) => update('featuredImage', e.target.value)} />
            </Field>
            <Field label='URLs galería (una por línea)'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-y' value={form.gallery} onChange={(e) => update('gallery', e.target.value)} />
            </Field>
          </div>
        )}

        {paso === 4 && (
          <div className='space-y-4'>
            <h3 className='text-xl font-bold border-b border-default pb-2'>SEO y publicación</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Meta title'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} />
              </Field>
              <Field label='Meta description'>
                <input className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} />
              </Field>
              <Field label='Visitantes anuales (millones)'>
                <input type='number' step='0.1' className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.annualVisitorsMillions} onChange={(e) => update('annualVisitorsMillions', Number(e.target.value))} />
              </Field>
              <Field label='Índice de seguridad (0–100)'>
                <input type='number' min='0' max='100' className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.safetyIndex} onChange={(e) => update('safetyIndex', Number(e.target.value))} />
              </Field>
              <Field label='Presupuesto diario (USD)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-accent' value={form.averageDailyBudgetUSD} onChange={(e) => update('averageDailyBudgetUSD', Number(e.target.value))} />
              </Field>
              <Field label='Estado'>
                <HeroSelect value={form.status} onValueChange={(v) => update('status', v)} options={opcionesEstado} triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary' />
              </Field>
            </div>
            <div className='flex items-center gap-5'>
              <label className='inline-flex items-center gap-2 text-sm cursor-pointer'>
                <input type='checkbox' checked={form.isPopular} onChange={(e) => update('isPopular', e.target.checked)} className='accent-accent' />
                Popular
              </label>
              <label className='inline-flex items-center gap-2 text-sm cursor-pointer'>
                <input type='checkbox' checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} className='accent-accent' />
                Destacado
              </label>
            </div>
          </div>
        )}

        <div className='pt-3 border-t border-default flex items-center justify-between'>
          <Button type='button' onClick={() => setPaso((p) => Math.max(1, p - 1))} disabled={paso === 1 || guardando}
            className='h-10 px-5 rounded-lg border border-default bg-surface hover:bg-surface-secondary disabled:opacity-40 text-sm font-medium text-foreground'>
            Atrás
          </Button>
          <span className='text-xs text-muted'>Paso {paso} de {pasos.length}</span>
          {paso < 4 ? (
            <Button type='button' onClick={() => canGoNext && setPaso((p) => Math.min(4, p + 1))} disabled={!canGoNext}
              className='h-10 px-5 rounded-lg bg-accent text-white font-semibold text-sm disabled:opacity-50'>
              Siguiente →
            </Button>
          ) : (
            <Button type='button' isPending={guardando} onClick={guardarDestino} className='h-10 px-5 bg-accent text-white font-semibold text-sm'>
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
