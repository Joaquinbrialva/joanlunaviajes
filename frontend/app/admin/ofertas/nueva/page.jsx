'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroSelect from '@/components/ui/hero-select';

const pasos = [
  { id: 1, label: 'Información general' },
  { id: 2, label: 'Logística y precios' },
  { id: 3, label: 'Contenido y media' },
  { id: 4, label: 'Revisión' },
];

const opcionesMoneda = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'ARS', label: 'ARS' },
];

const opcionesEstado = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
];

export default function AdminNewOfferPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    originCountry: 'Argentina',
    originCity: '',
    destinationCountry: '',
    destinationCity: '',
    destinationAirport: '',
    startDate: '',
    endDate: '',
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
    highlights: 'Asistencia local\nCoordinación integral\nExperiencia curada',
    coverImage: '',
    hotelName: '',
    hotelStars: 4,
  });

  const canGoNext = useMemo(() => {
    if (paso === 1) return Boolean(form.title && form.destinationCountry);
    if (paso === 2) return Boolean(form.price && form.days > 0);
    return true;
  }, [form, paso]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const goNext = () => setPaso((prev) => Math.min(4, prev + 1));
  const goBack = () => setPaso((prev) => Math.max(1, prev - 1));

  async function guardarOferta() {
    setError('');
    setGuardando(true);
    try {
      const response = await fetch('/api/admin/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo guardar la oferta.');
      }

      router.push('/admin/ofertas');
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
          <h2 className='text-4xl font-bold'>Crear nueva oferta</h2>
          <p className='text-muted'>Completá datos clave para publicar una nueva propuesta comercial.</p>
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
            <h3 className='text-2xl font-bold'>Datos generales</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Título de oferta *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.title} onChange={(e) => update('title', e.target.value)} />
              </Field>
              <Field label='Slug (opcional)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder='mi-oferta-2026' />
              </Field>
              <Field label='País de origen'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.originCountry} onChange={(e) => update('originCountry', e.target.value)} />
              </Field>
              <Field label='Ciudad de origen'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.originCity} onChange={(e) => update('originCity', e.target.value)} />
              </Field>
              <Field label='País de destino *'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value)} />
              </Field>
              <Field label='Ciudad de destino'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} />
              </Field>
              <Field label='Aeropuerto destino (IATA)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.destinationAirport} onChange={(e) => update('destinationAirport', e.target.value)} />
              </Field>
              <Field label='Imagen principal (URL)'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.coverImage} onChange={(e) => update('coverImage', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {paso === 2 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Logística y precios</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Field label='Días'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.days} onChange={(e) => update('days', Number(e.target.value))} min='1' />
              </Field>
              <Field label='Noches'>
                <input type='number' className='h-10 px-3 rounded-lg border border-default w-full' value={form.nights} onChange={(e) => update('nights', Number(e.target.value))} min='1' />
              </Field>
              <Field label='Moneda'>
                <HeroSelect
                  value={form.currency}
                  onValueChange={(value) => update('currency', value)}
                  options={opcionesMoneda}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
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
              <Field label='Fecha inicio disponibilidad'>
                <input type='date' className='h-10 px-3 rounded-lg border border-default w-full' value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
              </Field>
              <Field label='Fecha fin disponibilidad'>
                <input type='date' className='h-10 px-3 rounded-lg border border-default w-full' value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
              </Field>
              <Field label='Nombre de hotel'>
                <input className='h-10 px-3 rounded-lg border border-default w-full' value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {paso === 3 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Contenido y media</h3>
            <Field label='Resumen comercial'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.summary} onChange={(e) => update('summary', e.target.value)} />
            </Field>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <Field label='Incluye (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.includes} onChange={(e) => update('includes', e.target.value)} />
              </Field>
              <Field label='No incluye (una línea por ítem)'>
                <textarea className='min-h-28 px-3 py-2 rounded-lg border border-default w-full' value={form.notIncludes} onChange={(e) => update('notIncludes', e.target.value)} />
              </Field>
            </div>
            <Field label='Highlights (una línea por ítem)'>
              <textarea className='min-h-24 px-3 py-2 rounded-lg border border-default w-full' value={form.highlights} onChange={(e) => update('highlights', e.target.value)} />
            </Field>
          </section>
        )}

        {paso === 4 && (
          <section className='space-y-4'>
            <h3 className='text-2xl font-bold'>Revisión y publicación</h3>
            <div className='rounded-xl border border-default p-4 bg-surface-secondary space-y-2'>
              <p><strong>Título:</strong> {form.title || '-'}</p>
              <p><strong>Destino:</strong> {form.destinationCity || '-'}, {form.destinationCountry || '-'}</p>
              <p><strong>Duración:</strong> {form.days} días / {form.nights} noches</p>
              <p><strong>Precio:</strong> {form.currency} {form.price || 0}</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 items-center'>
              <Field label='Estado de publicación'>
                <HeroSelect
                  value={form.status}
                  onValueChange={(value) => update('status', value)}
                  options={opcionesEstado}
                  triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary'
                />
              </Field>
              <label className='inline-flex items-center gap-2 text-sm mt-5 md:mt-0'>
                <input type='checkbox' checked={form.featured} onChange={(e) => update('featured', e.target.checked)} />
                Marcar como destacada
              </label>
            </div>
          </section>
        )}

        {error ? <p className='text-sm text-rose-600'>{error}</p> : null}

        <div className='pt-3 border-t border-default flex items-center justify-between'>
          <button type='button' onClick={goBack} className='h-10 px-4 rounded-md border border-default bg-surface hover:bg-surface-secondary' disabled={paso === 1 || guardando}>
            Atrás
          </button>
          {paso < 4 ? (
            <button
              type='button'
              onClick={goNext}
              disabled={!canGoNext}
              className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'
            >
              Siguiente paso
            </button>
          ) : (
            <button type='button' onClick={guardarOferta} disabled={guardando} className='h-10 px-4 rounded-md bg-accent text-white font-semibold disabled:opacity-50'>
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
