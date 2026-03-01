'use client';

import { useMemo, useState } from 'react';

const steps = [
  { id: 1, label: 'General' },
  { id: 2, label: 'Pricing' },
  { id: 3, label: 'Itinerario y media' },
  { id: 4, label: 'Revision' },
];

export default function AdminNewOfferPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    originCountry: 'Argentina',
    originCity: '',
    destinationCountry: '',
    destinationCity: '',
    days: 7,
    nights: 6,
    currency: 'USD',
    price: '',
    originalPrice: '',
    seats: 12,
    status: 'draft',
    featured: false,
    summary: '',
    includes: 'Vuelos\nHotel\nTraslados',
    notIncludes: 'Propinas\nGastos personales',
  });

  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(form.title && form.destinationCountry);
    if (step === 2) return Boolean(form.price && form.days > 0);
    return true;
  }, [form, step]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const goNext = () => setStep((prev) => Math.min(4, prev + 1));
  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  return (
    <div className='space-y-6'>
      <section className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div>
          <h2 className='text-4xl font-bold'>Create New Offer</h2>
          <p className='text-muted'>Completa datos clave para publicar una nueva propuesta comercial.</p>
        </div>
        <button type='button' className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary'>
          Save Draft
        </button>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-6 space-y-6'>
        <div className='grid grid-cols-4 gap-3'>
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
            <h3 className='text-2xl font-bold'>Basic Details</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Offer title *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.title} onChange={(e) => update('title', e.target.value)} />
              </Field>
              <Field label='Slug'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder='mi-oferta-2026' />
              </Field>
              <Field label='Pais origen'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.originCountry} onChange={(e) => update('originCountry', e.target.value)} />
              </Field>
              <Field label='Ciudad origen'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.originCity} onChange={(e) => update('originCity', e.target.value)} />
              </Field>
              <Field label='Pais destino *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value)} />
              </Field>
              <Field label='Ciudad destino'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Logistics & Pricing</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Field label='Dias'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.days} onChange={(e) => update('days', Number(e.target.value))} min='1' />
              </Field>
              <Field label='Noches'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.nights} onChange={(e) => update('nights', Number(e.target.value))} min='1' />
              </Field>
              <Field label='Moneda'>
                <select className='h-10 px-3 rounded-lg border border-default w-full' value={form.currency} onChange={(e) => update('currency', e.target.value)}>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>ARS</option>
                </select>
              </Field>
              <Field label='Precio base *'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.price} onChange={(e) => update('price', e.target.value)} min='0' />
              </Field>
              <Field label='Precio original (opcional)'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} min='0' />
              </Field>
              <Field label='Cupos'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.seats} onChange={(e) => update('seats', Number(e.target.value))} min='1' />
              </Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Content & Media</h3>
            <Field label='Resumen comercial'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.summary} onChange={(e) => update('summary', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Incluye (una linea por item)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.includes} onChange={(e) => update('includes', e.target.value)} />
              </Field>
              <Field label='No incluye (una linea por item)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.notIncludes} onChange={(e) => update('notIncludes', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Review & Publish</h3>
            <div className='rounded-xl border border-default p-4 bg-surface-secondary space-y-2'>
              <p><strong>Titulo:</strong> {form.title || '-'}</p>
              <p><strong>Destino:</strong> {form.destinationCity || '-'}, {form.destinationCountry || '-'}</p>
              <p><strong>Duracion:</strong> {form.days} dias / {form.nights} noches</p>
              <p><strong>Precio:</strong> {form.currency} {form.price || 0}</p>
            </div>

            <div className='flex items-center gap-3'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='radio' checked={form.status === 'draft'} onChange={() => update('status', 'draft')} />
                Draft
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='radio' checked={form.status === 'published'} onChange={() => update('status', 'published')} />
                Published
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
                Featured
              </label>
            </div>
          </section>
        )}

        <div className='pt-3 border-t border-default flex items-center justify-between'>
          <button type='button' onClick={goBack} className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary' disabled={step === 1}>
            Back
          </button>
          {step < 4 ? (
            <button
              type='button'
              onClick={goNext}
              disabled={!canGoNext}
              className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'
            >
              Next step
            </button>
          ) : (
            <button type='button' className='h-10 px-4 rounded-md bg-accent text-white font-semibold'>
              Finish & Save
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
