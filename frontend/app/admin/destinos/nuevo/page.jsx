'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const steps = [
  { id: 1, label: 'Identidad' },
  { id: 2, label: 'Viaje y clima' },
  { id: 3, label: 'Contenido y media' },
  { id: 4, label: 'SEO y publicacion' },
];

export default function AdminNewDestinationPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    country: '',
    continent: 'America',
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
    highlights: 'Tours guiados\nGastronomia local',
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
    if (step === 1) return Boolean(form.name && form.country);
    if (step === 2) return Boolean(form.airport && form.language);
    if (step === 3) return Boolean(form.description && form.shortDescription);
    return true;
  }, [form, step]);

  const goNext = () => setStep((prev) => Math.min(4, prev + 1));
  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Create New Destination</h2>
          <p className='text-muted'>Completa informacion editorial y comercial del destino.</p>
        </div>
        <button type='button' className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary'>
          Save Draft
        </button>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-6 space-y-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {steps.map((item) => {
            const active = item.id === step;
            const done = item.id < step;
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => setStep(item.id)}
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

        {step === 1 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Identidad del destino</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Nombre *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.name} onChange={(e) => update('name', e.target.value)} />
              </Field>
              <Field label='Slug'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder='patagonia-argentina' />
              </Field>
              <Field label='Pais *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.country} onChange={(e) => update('country', e.target.value)} />
              </Field>
              <Field label='Continente'>
                <select className='h-10 px-3 rounded-lg border border-default w-full' value={form.continent} onChange={(e) => update('continent', e.target.value)}>
                  <option>America</option>
                  <option>Europa</option>
                  <option>Asia</option>
                  <option>Africa</option>
                  <option>Oceania</option>
                </select>
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Informacion de viaje y clima</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Field label='Aeropuerto (IATA)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.airport} onChange={(e) => update('airport', e.target.value)} />
              </Field>
              <Field label='Moneda'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.currency} onChange={(e) => update('currency', e.target.value)} />
              </Field>
              <Field label='Idioma'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.language} onChange={(e) => update('language', e.target.value)} />
              </Field>
              <Field label='Timezone'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.timezone} onChange={(e) => update('timezone', e.target.value)} />
              </Field>
              <Field label='Estadia recomendada (dias)'>
                <input type='number' min='1' className='h-10 px-3 rounded-lg border border-default w-full' value={form.recommendedStayDays} onChange={(e) => update('recommendedStayDays', Number(e.target.value))} />
              </Field>
              <Field label='Tipo de clima'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.climateType} onChange={(e) => update('climateType', e.target.value)} />
              </Field>
              <Field label='Temperatura promedio (C)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.averageTemperatureC} onChange={(e) => update('averageTemperatureC', Number(e.target.value))} />
              </Field>
              <Field label='Meses recomendados (coma)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.bestMonthsToVisit} onChange={(e) => update('bestMonthsToVisit', e.target.value)} />
              </Field>
              <Field label='Visa requerida'>
                <label className='inline-flex items-center gap-2 h-10'>
                  <input type='checkbox' checked={form.visaRequired} onChange={(e) => update('visaRequired', e.target.checked)} />
                  {form.visaRequired ? 'Si' : 'No'}
                </label>
              </Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Contenido editorial y media</h3>
            <Field label='Descripcion larga'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.description} onChange={(e) => update('description', e.target.value)} />
            </Field>
            <Field label='Descripcion corta'>
              <textarea className='min-h-20 px-3 py-2 rounded-lg border border-default w-full' value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Highlights (una linea por item)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.highlights} onChange={(e) => update('highlights', e.target.value)} />
              </Field>
              <Field label='Travel styles (una linea por item)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.travelStyles} onChange={(e) => update('travelStyles', e.target.value)} />
              </Field>
            </div>
            <Field label='Featured image URL'>
              <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.featuredImage} onChange={(e) => update('featuredImage', e.target.value)} />
            </Field>
            <Field label='Gallery URLs (una por linea)'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.gallery} onChange={(e) => update('gallery', e.target.value)} />
            </Field>
          </section>
        )}

        {step === 4 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>SEO y publicacion</h3>
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
              <Field label='Indice de seguridad'>
                <input type='number' min='0' max='100' className='h-10 px-3 rounded-lg border border-default w-full' value={form.safetyIndex} onChange={(e) => update('safetyIndex', Number(e.target.value))} />
              </Field>
              <Field label='Budget diario USD'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.averageDailyBudgetUSD} onChange={(e) => update('averageDailyBudgetUSD', Number(e.target.value))} />
              </Field>
              <Field label='Estado'>
                <select className='h-10 px-3 rounded-lg border border-default w-full' value={form.status} onChange={(e) => update('status', e.target.value)}>
                  <option value='draft'>Draft</option>
                  <option value='published'>Published</option>
                </select>
              </Field>
            </div>

            <div className='flex items-center gap-5'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={form.isPopular} onChange={(e) => update('isPopular', e.target.checked)} />
                Popular
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} />
                Featured
              </label>
            </div>

            <div className='rounded-xl border border-default p-4 bg-surface-secondary'>
              <p className='text-sm text-muted'>Preview rapido</p>
              <p className='text-lg font-bold'>{form.name || 'Nuevo destino'}</p>
              <p className='text-sm text-muted'>{form.country || '-'} · {form.continent}</p>
              <p className='text-sm mt-2'>Budget diario: USD {form.averageDailyBudgetUSD}</p>
            </div>
          </section>
        )}

        <div className='pt-3 border-t border-default flex items-center justify-between'>
          <button type='button' onClick={goBack} className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary' disabled={step === 1}>
            Back
          </button>
          {step < 4 ? (
            <button type='button' onClick={goNext} disabled={!canGoNext} className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'>
              Next step
            </button>
          ) : (
            <Link href='/admin/destinos' className='inline-flex items-center justify-center h-10 px-4 rounded-md bg-accent text-white font-semibold'>
              Finish & Save
            </Link>
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
