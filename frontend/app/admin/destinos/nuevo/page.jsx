'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminNewDestinationPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    country: '',
    continent: 'América',
    description: '',
    shortDescription: '',
    airport: '',
    currency: 'USD',
    language: '',
    timezone: '',
    visaRequired: false,
    recommendedStayDays: 7,
    climateType: '',
    averageTemperatureC: 20,
    bestMonthsToVisit: 'Enero, Febrero, Marzo',
    highlights: 'Tours guiados\nGastronomía local',
    travelStyles: 'Cultural\nNaturaleza',
    featuredImage: '',
    gallery: 'https://picsum.photos/seed/newdest1/1200/800\nhttps://picsum.photos/seed/newdest2/1200/800\nhttps://picsum.photos/seed/newdest3/1200/800',
    annualVisitorsMillions: 3,
    safetyIndex: 75,
    averageDailyBudgetUSD: 120,
    metaTitle: '',
    metaDescription: '',
    isPopular: true,
    isFeatured: false,
    status: 'draft',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const canGoNext = useMemo(() => {
    if (paso === 1) return Boolean(form.name && form.country);
    if (paso === 2) return Boolean(form.airport && form.language);
    if (paso === 3) return Boolean(form.description && form.shortDescription);
    return true;
  }, [form, paso]);

  const goNext = () => setPaso((prev) => Math.min(4, prev + 1));
  const goBack = () => setPaso((prev) => Math.max(1, prev - 1));

  async function guardarDestino() {
    setError('');
    setGuardando(true);
    try {
      const response = await fetch('/api/admin/destinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo guardar el destino.');
      }

      router.push('/admin/destinos');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Crear nuevo destino</h2>
          <p className='text-muted'>Completá información editorial y comercial del destino.</p>
        </div>
        <button type='button' className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary'>
          Guardar borrador
        </button>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-6 space-y-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {pasos.map((item) => {
            const active = item.id === paso;
            const done = item.id < paso;
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => setPaso(item.id)}
                className={`h-11 rounded-xl text-sm font-semibold border ${
                  active
                    ? 'bg-accent text-white border-accent'
                    : done
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-surface-secondary border-default text-muted'
                }`}
              >
                {item.id}. {item.label}
              </button>
            );
          })}
        </div>

        {paso === 1 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Identidad del destino</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Nombre *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.name} onChange={(e) => update('name', e.target.value)} />
              </Field>
              <Field label='Slug (opcional)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder='patagonia-argentina' />
              </Field>
              <Field label='País *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.country} onChange={(e) => update('country', e.target.value)} />
              </Field>
              <Field label='Continente'>
                <HeroSelect
                  value={form.continent}
                  onValueChange={(value) => update('continent', value)}
                  options={opcionesContinente}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
              </Field>
            </div>
          </section>
        )}

        {paso === 2 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Información de viaje y clima</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Field label='Aeropuerto (IATA)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.airport} onChange={(e) => update('airport', e.target.value)} />
              </Field>
              <Field label='Moneda'>
                <HeroSelect
                  value={form.currency}
                  onValueChange={(value) => update('currency', value)}
                  options={opcionesMoneda}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
              </Field>
              <Field label='Idioma'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.language} onChange={(e) => update('language', e.target.value)} />
              </Field>
              <Field label='Zona horaria'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.timezone} onChange={(e) => update('timezone', e.target.value)} />
              </Field>
              <Field label='Estadía recomendada (días)'>
                <input type='number' min='1' className='h-10 px-3 rounded-lg border border-default w-full' value={form.recommendedStayDays} onChange={(e) => update('recommendedStayDays', Number(e.target.value))} />
              </Field>
              <Field label='Tipo de clima'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.climateType} onChange={(e) => update('climateType', e.target.value)} />
              </Field>
              <Field label='Temperatura promedio (°C)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.averageTemperatureC} onChange={(e) => update('averageTemperatureC', Number(e.target.value))} />
              </Field>
              <Field label='Mejores meses (separados por coma)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.bestMonthsToVisit} onChange={(e) => update('bestMonthsToVisit', e.target.value)} />
              </Field>
              <Field label='¿Requiere visa?'>
                <label className='inline-flex items-center gap-2 h-10'>
                  <input type='checkbox' checked={form.visaRequired} onChange={(e) => update('visaRequired', e.target.checked)} />
                  {form.visaRequired ? 'Sí' : 'No'}
                </label>
              </Field>
            </div>
          </section>
        )}

        {paso === 3 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Contenido editorial y media</h3>
            <Field label='Descripción larga'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.description} onChange={(e) => update('description', e.target.value)} />
            </Field>
            <Field label='Descripción corta'>
              <textarea className='min-h-20 px-3 py-2 rounded-lg border border-default w-full' value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Highlights (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.highlights} onChange={(e) => update('highlights', e.target.value)} />
              </Field>
              <Field label='Estilos de viaje (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.travelStyles} onChange={(e) => update('travelStyles', e.target.value)} />
              </Field>
            </div>
            <Field label='URL imagen destacada'>
              <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.featuredImage} onChange={(e) => update('featuredImage', e.target.value)} />
            </Field>
            <Field label='URLs galería (una por línea)'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.gallery} onChange={(e) => update('gallery', e.target.value)} />
            </Field>
          </section>
        )}

        {paso === 4 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>SEO y publicación</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Meta title'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} />
              </Field>
              <Field label='Meta description'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} />
              </Field>
              <Field label='Visitantes anuales (millones)'>
                <input type='number' step='0.1' className='h-10 px-3 rounded-lg border border-default w-full' value={form.annualVisitorsMillions} onChange={(e) => update('annualVisitorsMillions', Number(e.target.value))} />
              </Field>
              <Field label='Índice de seguridad'>
                <input type='number' min='0' max='100' className='h-10 px-3 rounded-lg border border-default w-full' value={form.safetyIndex} onChange={(e) => update('safetyIndex', Number(e.target.value))} />
              </Field>
              <Field label='Presupuesto diario (USD)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.averageDailyBudgetUSD} onChange={(e) => update('averageDailyBudgetUSD', Number(e.target.value))} />
              </Field>
              <Field label='Estado'>
                <HeroSelect
                  value={form.status}
                  onValueChange={(value) => update('status', value)}
                  options={opcionesEstado}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
              </Field>
            </div>

            <div className='flex items-center gap-5'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={form.isPopular} onChange={(e) => update('isPopular', e.target.checked)} />
                Popular
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} />
                Destacado
              </label>
            </div>

            <div className='rounded-xl border border-default p-4 bg-surface-secondary'>
              <p className='text-sm text-muted'>Vista previa rápida</p>
              <p className='text-lg font-bold'>{form.name || 'Nuevo destino'}</p>
              <p className='text-sm text-muted'>{form.country || '-'} · {form.continent}</p>
              <p className='text-sm mt-2'>Presupuesto diario: USD {form.averageDailyBudgetUSD}</p>
            </div>
          </section>
        )}

        {error ? <p className='text-sm text-rose-600'>{error}</p> : null}

        <div className='pt-3 border-t border-default flex items-center justify-between'>
          <button type='button' onClick={goBack} className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary' disabled={paso === 1 || guardando}>
            Atrás
          </button>
          {paso < 4 ? (
            <button type='button' onClick={goNext} disabled={!canGoNext} className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'>
              Siguiente paso
            </button>
          ) : (
            <button type='button' onClick={guardarDestino} disabled={guardando} className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'>
              {guardando ? 'Guardando...' : 'Finalizar y guardar'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className='space-y-1 block'>
      <span className='text-sm font-medium'>{label}</span>
      {children}
    </label>
  );
}
