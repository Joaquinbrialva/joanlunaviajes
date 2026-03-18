'use client';

import { useState } from 'react';
import { LuPhone, LuMail, LuMapPin, LuClock, LuSend, LuCheck } from 'react-icons/lu';
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa';
import NewsLetter from '@/components/inicio/sections/NewsLetter';

const INFO_ITEMS = [
  {
    Icon: LuPhone,
    label: 'Teléfono',
    value: '011 5813-9420',
    href: 'tel:+541158139420',
  },
  {
    Icon: LuMail,
    label: 'Email',
    value: 'hola@joanlunaviajes.com',
    href: 'mailto:hola@joanlunaviajes.com',
  },
  {
    Icon: LuMapPin,
    label: 'Dirección',
    value: 'Av. Corrientes 2174 Local 192, CABA',
    href: 'https://maps.google.com/?q=Av.+Corrientes+2174+Local+192,+Buenos+Aires',
  },
  {
    Icon: LuClock,
    label: 'Horarios',
    value: 'Lun–Vie 9:00–18:00 · Sáb 10:00–14:00',
    href: null,
  },
];

const MOTIVOS = [
  'Consulta general',
  'Cotización de viaje',
  'Modificar una reserva',
  'Reclamo o sugerencia',
  'Otro',
];

const INITIAL = { nombre: '', email: '', telefono: '', motivo: '', mensaje: '' };

export default function ContactoPage() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre,
          email: form.email,
          phone: form.telefono,
          subject: form.motivo,
          message: form.mensaje,
        }),
      });

      if (!res.ok) throw new Error('No se pudo enviar el mensaje');
      setStatus('success');
      setForm(INITIAL);
    } catch (err) {
      setError(err.message || 'Error al enviar. Intentá de nuevo.');
      setStatus('error');
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className='w-screen -mx-[calc((100vw-100%)/2)] bg-linear-to-br from-slate-800 to-slate-900 py-20 text-center text-white'>
        <div className='max-w-3xl mx-auto px-4'>
          <p className='text-sm uppercase tracking-widest text-orange-400 font-semibold mb-3'>Contacto</p>
          <h1 className='text-4xl md:text-5xl font-bold mb-5'>Hablemos de tu próximo viaje</h1>
          <p className='text-lg text-gray-300 leading-relaxed'>
            Escribinos, llamanos o pasá por la oficina. Estamos para ayudarte a organizar la experiencia que soñás.
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <section className='max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-12'>
        {/* Formulario */}
        <div>
          <p className='text-sm uppercase tracking-widest text-accent font-semibold mb-2'>Envianos un mensaje</p>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-6'>¿En qué te podemos ayudar?</h2>

          {status === 'success' ? (
            <div className='flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-12 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40'>
                <LuCheck className='h-7 w-7 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <p className='text-lg font-semibold text-slate-800 dark:text-white'>¡Mensaje enviado!</p>
                <p className='text-sm text-slate-500 dark:text-gray-300 mt-1'>
                  Te respondemos a la brevedad, generalmente en menos de 24 horas.
                </p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className='mt-2 text-sm font-medium text-accent hover:underline'
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-slate-700 dark:text-gray-300'>
                    Nombre <span className='text-rose-500'>*</span>
                  </label>
                  <input
                    required
                    className='w-full h-10 rounded-lg border border-default bg-surface px-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40'
                    placeholder='Tu nombre'
                    value={form.nombre}
                    onChange={(e) => update('nombre', e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-slate-700 dark:text-gray-300'>
                    Email <span className='text-rose-500'>*</span>
                  </label>
                  <input
                    required
                    type='email'
                    className='w-full h-10 rounded-lg border border-default bg-surface px-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40'
                    placeholder='nombre@email.com'
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-slate-700 dark:text-gray-300'>Teléfono</label>
                  <input
                    type='tel'
                    className='w-full h-10 rounded-lg border border-default bg-surface px-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40'
                    placeholder='+54 11 ...'
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-slate-700 dark:text-gray-300'>
                    Motivo <span className='text-rose-500'>*</span>
                  </label>
                  <select
                    required
                    className='w-full h-10 rounded-lg border border-default bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40'
                    value={form.motivo}
                    onChange={(e) => update('motivo', e.target.value)}
                  >
                    <option value=''>Seleccioná un motivo</option>
                    {MOTIVOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-slate-700 dark:text-gray-300'>
                  Mensaje <span className='text-rose-500'>*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  className='w-full rounded-lg border border-default bg-surface px-3 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none'
                  placeholder='Contanos qué tenés en mente...'
                  value={form.mensaje}
                  onChange={(e) => update('mensaje', e.target.value)}
                />
              </div>

              {status === 'error' && (
                <p className='text-sm text-rose-600 dark:text-rose-400'>{error}</p>
              )}

              <button
                type='submit'
                disabled={status === 'loading'}
                className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60'
              >
                {status === 'loading' ? (
                  <>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Enviando...
                  </>
                ) : (
                  <>
                    <LuSend size={15} />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info de contacto */}
        <div className='space-y-6'>
          <div>
            <p className='text-sm uppercase tracking-widest text-accent font-semibold mb-2'>Información</p>
            <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-6'>Encontranos</h2>
          </div>

          <div className='space-y-4'>
            {INFO_ITEMS.map(({ Icon, label, value, href }) => (
              <div key={label} className='flex items-start gap-4'>
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10'>
                  <Icon className='h-5 w-5 text-accent' />
                </div>
                <div>
                  <p className='text-xs text-muted font-medium uppercase tracking-wide mb-0.5'>{label}</p>
                  {href ? (
                    <a href={href} className='text-sm text-slate-700 dark:text-gray-200 hover:text-accent transition-colors'>
                      {value}
                    </a>
                  ) : (
                    <p className='text-sm text-slate-700 dark:text-gray-200'>{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Redes */}
          <div>
            <p className='text-xs text-muted font-medium uppercase tracking-wide mb-3'>Seguinos</p>
            <div className='flex gap-3'>
              <a
                href='https://wa.me/541158139420'
                target='_blank'
                rel='noopener noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-default text-slate-600 dark:text-gray-300 hover:text-accent hover:border-accent/40 transition-colors'
                aria-label='WhatsApp'
              >
                <FaWhatsapp size={18} />
              </a>
              <a
                href='https://www.instagram.com/p/DNOOawNOtbG/'
                target='_blank'
                rel='noopener noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-default text-slate-600 dark:text-gray-300 hover:text-accent hover:border-accent/40 transition-colors'
                aria-label='Instagram'
              >
                <FaInstagram size={18} />
              </a>
              <a
                href='https://www.facebook.com/JoanLunaViajes/'
                target='_blank'
                rel='noopener noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-default text-slate-600 dark:text-gray-300 hover:text-accent hover:border-accent/40 transition-colors'
                aria-label='Facebook'
              >
                <FaFacebook size={18} />
              </a>
            </div>
          </div>

          {/* Mapa */}
          <div className='rounded-2xl overflow-hidden border border-default'>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.9685189677566!2d-58.40033972447615!3d-34.60495755756325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccaeb00b32c33%3A0x7398571e0444cb83!2sJOANLUNA!5e0!3m2!1ses-419!2sar!4v1773798013399!5m2!1ses-419!2sar'
              width='100%'
              height='220'
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          </div>
        </div>
      </section>

      <NewsLetter />
    </div>
  );
}
