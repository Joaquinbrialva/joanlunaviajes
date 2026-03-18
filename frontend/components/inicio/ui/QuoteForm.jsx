'use client';

import { useState } from 'react';
import { Button, NumberField, Spinner } from '@heroui/react';
import { LuCalendarDays, LuMapPin, LuShieldCheck, LuUsers } from 'react-icons/lu';
import { FaRegClock } from 'react-icons/fa';
import { toastError } from '@/lib/toast';
import { formatCurrency } from '@/util/utils';
import { Minus, Plus } from 'lucide-react';

function formatDate(dateLike) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateLike));
}

export default function QuoteForm({ offer }) {
  const [passengers, setPassengers] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const price = offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
  const total = price * passengers;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toastError('Completá nombre y teléfono.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          passengers,
          message: message.trim(),
          offerSlug: offer.slug,
          offerTitle: offer.title,
        }),
      });
      if (!res.ok) {
        let errMsg = 'No se pudo enviar la solicitud.';
        try {
          const data = await res.json();
          errMsg = data?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      setStatus('success');
    } catch (err) {
      toastError(err, 'Error al enviar');
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <aside className='xl:sticky xl:top-24 space-y-4'>
        <div className='rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-6 text-center space-y-3'>
          <div className='text-4xl'>✓</div>
          <h3 className='text-xl font-bold text-emerald-700 dark:text-emerald-400'>¡Solicitud enviada!</h3>
          <p className='text-sm text-muted'>Te contactaremos pronto a través de WhatsApp o email para coordinar tu viaje.</p>
          <Button
            type='button'
            className='mt-2 bg-accent text-white w-full'
            onClick={() => setStatus('idle')}
          >
            Enviar otra consulta
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className='xl:sticky xl:top-24 space-y-4'>
      <div className='rounded-2xl border border-default bg-surface p-5 space-y-5'>
        {/* Precio */}
        <div>
          <p className='text-xs uppercase tracking-wider text-muted mb-1'>Desde</p>
          <p className='text-4xl font-bold text-foreground'>
            {formatCurrency({ amount: price, currency: offer.pricing.currency })}
            <span className='text-base font-normal text-muted'> / {offer.pricing.pricePer || 'persona'}</span>
          </p>
        </div>

        {/* Resumen */}
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='border border-default rounded-xl p-3'>
            <p className='text-xs text-muted uppercase flex items-center gap-1'><FaRegClock /> Duración</p>
            <p className='font-medium mt-0.5'>{offer.duration.days} días / {offer.duration.nights} noches</p>
          </div>
          <div className='border border-default rounded-xl p-3'>
            <p className='text-xs text-muted uppercase flex items-center gap-1'><LuUsers /> Cupos</p>
            <p className='font-medium mt-0.5'>Máx {offer.availability.remainingSpots}</p>
          </div>
          <div className='border border-default rounded-xl p-3'>
            <p className='text-xs text-muted uppercase flex items-center gap-1'><LuCalendarDays /> Salida</p>
            <p className='font-medium mt-0.5'>{formatDate(offer.availability.startDate)}</p>
          </div>
          <div className='border border-default rounded-xl p-3'>
            <p className='text-xs text-muted uppercase flex items-center gap-1'><LuMapPin /> Regreso</p>
            <p className='font-medium mt-0.5'>{formatDate(offer.availability.endDate)}</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div>
            <label className='text-xs font-medium text-muted block mb-1'>Nombre completo *</label>
            <input
              className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tu nombre completo'
              required
            />
          </div>
          <div>
            <label className='text-xs font-medium text-muted block mb-1'>Teléfono / WhatsApp *</label>
            <input
              className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='+54 9 11 1234-5678'
              type='tel'
              required
            />
          </div>
          <div>
            <label className='text-xs font-medium text-muted block mb-1'>Email</label>
            <input
              className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='tu@email.com'
              type='email'
            />
          </div>

          {/* Pasajeros */}
          <div>
            <label className='text-xs font-medium text-muted block mb-1'>Cantidad de pasajeros</label>
            <NumberField
              value={passengers}
              onChange={(v) => setPassengers(isNaN(v) ? 1 : Math.max(1, v))}
              minValue={1}
              formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
            >
              <NumberField.Group className='h-10 rounded-lg border border-default flex items-center overflow-hidden bg-surface w-full'>
                <NumberField.DecrementButton className='h-full px-3 hover:bg-surface-secondary border-r border-default flex items-center'>
                  <Minus size={14} />
                </NumberField.DecrementButton>
                <NumberField.Input className='flex-1 h-full px-3 bg-transparent text-sm outline-none text-center' />
                <NumberField.IncrementButton className='h-full px-3 hover:bg-surface-secondary border-l border-default flex items-center'>
                  <Plus size={14} />
                </NumberField.IncrementButton>
              </NumberField.Group>
            </NumberField>
          </div>

          <div>
            <label className='text-xs font-medium text-muted block mb-1'>Mensaje (opcional)</label>
            <textarea
              className='min-h-20 px-3 py-2 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-none'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='Contanos qué necesitás...'
            />
          </div>

          {/* Total estimado */}
          <div className='flex items-end justify-between border-t border-default pt-3'>
            <span className='text-muted text-sm'>Total estimado</span>
            <strong className='text-xl text-accent'>
              {formatCurrency({ amount: total, currency: offer.pricing.currency })}
            </strong>
          </div>

          <Button
            type='submit'
            isPending={status === 'loading'}
            className='w-full bg-accent text-white font-semibold'
            size='lg'
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color='current' size='sm' />}
                {isPending ? 'Enviando...' : 'Solicitar cotización'}
              </>
            )}
          </Button>
        </form>

        <div className='grid grid-cols-2 gap-2 text-xs text-muted'>
          <p className='inline-flex items-center gap-1'><LuShieldCheck />Reserva segura</p>
          <p className='text-right'>Soporte 24/7</p>
        </div>
      </div>
    </aside>
  );
}
