'use client';

import { useState } from 'react';
import { NumberField, Spinner } from '@heroui/react';
import { LuCalendarDays, LuCalendar, LuMapPin, LuShieldCheck, LuUsers, LuSend, LuCheck } from 'react-icons/lu';
import { FaRegClock } from 'react-icons/fa';
import { Minus, Plus } from 'lucide-react';
import { toastError } from '@/lib/toast';
import { formatCurrency } from '@/util/utils';

function formatDate(dateLike) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(dateLike));
}

function FloatInput({ label, value, onChange, type = 'text', required, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || Boolean(value);

  return (
    <div className="relative">
      <label
        className={`absolute left-3.5 pointer-events-none transition-all duration-150 ${
          floated
            ? 'top-1.5 text-[10px] font-semibold text-accent'
            : 'top-1/2 -translate-y-1/2 text-sm text-muted'
        }`}
      >
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={floated ? placeholder : ''}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full h-12 pt-5 pb-1 px-3.5 rounded-xl border border-border bg-surface text-sm text-foreground outline-none transition-colors focus:border-accent placeholder:text-muted/50"
      />
    </div>
  );
}

function FloatTextarea({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || Boolean(value);

  return (
    <div className="relative">
      <label
        className={`absolute left-3.5 pointer-events-none transition-all duration-150 ${
          floated
            ? 'top-2 text-[10px] font-semibold text-accent'
            : 'top-3.5 text-sm text-muted'
        }`}
      >
        Mensaje (opcional)
      </label>
      <textarea
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={floated ? 'Cuéntanos qué necesitas...' : ''}
        rows={3}
        className="w-full pt-7 pb-2 px-3.5 rounded-xl border border-border bg-surface text-sm text-foreground outline-none transition-colors focus:border-accent resize-none placeholder:text-muted/50"
      />
    </div>
  );
}

export default function QuoteForm({ offer }) {
  const [passengers, setPassengers] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const price = offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || null;
  const hasPrice = price != null && price > 0;
  const total = hasPrice ? price * passengers : null;
  const currency = offer.pricing?.currency || 'USD';
  const originalPrice = offer.pricing?.originalPrice;
  const hasDiscount = offer.pricing?.discountPercentage > 0 && originalPrice && originalPrice > (price || 0);

  const avail = offer.availability || {};
  const hasStartDate = Boolean(avail.startDate);
  const hasEndDate = Boolean(avail.endDate);
  const hasAvailableMonths = Boolean(avail.availableMonths);
  const remainingSpots = avail.remainingSpots;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toastError('Completa nombre y teléfono.');
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
      <aside className="xl:sticky xl:top-24">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center mx-auto">
            <LuCheck size={26} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">¡Solicitud enviada!</h3>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">
              Te contactamos pronto por WhatsApp o email para coordinar tu viaje.
            </p>
          </div>
          <button
            type="button"
            className="w-full h-11 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-surface-secondary transition-colors"
            onClick={() => setStatus('idle')}
          >
            Enviar otra consulta
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="xl:sticky xl:top-24">
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        {/* Price header */}
        <div className="px-5 py-5 border-b border-border">
          {hasPrice ? (
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted font-medium mb-1">
                  Desde
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {hasDiscount && (
                    <span className="text-sm text-muted line-through">
                      {formatCurrency({ amount: originalPrice, currency })}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-foreground leading-none">
                    {formatCurrency({ amount: price, currency })}
                  </span>
                  <span className="text-sm text-muted">
                    / {offer.pricing?.pricePer || 'persona'}
                  </span>
                </div>
                {hasDiscount && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    -{offer.pricing.discountPercentage}% OFF
                  </span>
                )}
              </div>
              {offer.availability?.limitedSpots && remainingSpots > 0 && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 px-2.5 py-1 rounded-full">
                  ⚡ Solo quedan {remainingSpots}
                </span>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted font-medium mb-1">Precio</p>
              <p className="text-2xl font-bold text-accent">A consultar</p>
              <p className="text-xs text-muted mt-1">Completa el formulario y te cotizamos.</p>
            </div>
          )}
        </div>

        {/* Info pills */}
        {(offer.duration?.days > 0 || hasStartDate || hasEndDate || hasAvailableMonths || remainingSpots > 0) && (
          <div className="grid grid-cols-2 gap-2 px-5 py-4 border-b border-border">
            {offer.duration?.days > 0 && offer.availability?.startDate && offer.availability?.endDate && (
              <div className="rounded-xl bg-surface-secondary px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <FaRegClock size={9} /> Duración
                </p>
                <p className="text-xs font-semibold">
                  {offer.duration.days}d / {offer.duration.nights}n
                </p>
              </div>
            )}
            {remainingSpots > 0 && (
              <div className="rounded-xl bg-surface-secondary px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <LuUsers size={9} /> Cupos
                </p>
                <p className="text-xs font-semibold">{remainingSpots}</p>
              </div>
            )}
            {hasStartDate && (
              <div className="rounded-xl bg-surface-secondary px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <LuCalendarDays size={9} /> Salida
                </p>
                <p className="text-xs font-semibold">{formatDate(avail.startDate)}</p>
              </div>
            )}
            {hasEndDate && (
              <div className="rounded-xl bg-surface-secondary px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <LuMapPin size={9} /> Regreso
                </p>
                <p className="text-xs font-semibold">{formatDate(avail.endDate)}</p>
              </div>
            )}
            {!hasStartDate && hasAvailableMonths && (
              <div className="rounded-xl bg-surface-secondary px-3 py-2.5 col-span-2">
                <p className="text-[10px] text-muted uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <LuCalendar size={9} /> Disponibilidad
                </p>
                <p className="text-xs font-semibold">{avail.availableMonths}</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <FloatInput
            label="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            autoComplete="name"
          />
          <FloatInput
            label="Teléfono / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            required
            placeholder="+54 9 11 1234-5678"
            autoComplete="tel"
          />
          <FloatInput
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
          />

          {/* Passengers */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted font-semibold block mb-1.5 ml-0.5">
              Pasajeros
            </label>
            <NumberField
              value={passengers}
              onChange={(v) => setPassengers(isNaN(v) ? 1 : Math.max(1, v))}
              minValue={1}
              formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
            >
              <NumberField.Group className="h-11 rounded-xl border border-border flex items-center overflow-hidden bg-surface w-full">
                <NumberField.DecrementButton className="h-full px-3.5 hover:bg-surface-secondary border-r border-border flex items-center text-muted hover:text-foreground transition-colors">
                  <Minus size={13} />
                </NumberField.DecrementButton>
                <NumberField.Input className="flex-1 h-full px-3 bg-transparent text-sm outline-none text-center font-semibold" />
                <NumberField.IncrementButton className="h-full px-3.5 hover:bg-surface-secondary border-l border-border flex items-center text-muted hover:text-foreground transition-colors">
                  <Plus size={13} />
                </NumberField.IncrementButton>
              </NumberField.Group>
            </NumberField>
          </div>

          <FloatTextarea value={message} onChange={(e) => setMessage(e.target.value)} />

          {/* Total estimado */}
          {hasPrice && total && (
            <div className="flex items-center justify-between rounded-xl bg-accent/5 border border-accent/20 px-4 py-3">
              <span className="text-sm text-muted">Total estimado</span>
              <strong className="text-lg font-bold text-accent">
                {formatCurrency({ amount: total, currency })}
              </strong>
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group relative w-full h-12 rounded-xl bg-brand-primary text-brand-primary-foreground font-semibold text-sm overflow-hidden transition-all duration-300 hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:translate-y-0 shadow-md shadow-brand-primary/25 hover:shadow-xl hover:shadow-brand-primary/35"
          >
            {/* Shimmer on hover */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
              }}
            />
            {/* Subtle overlay que aclara en hover */}
            <span className="pointer-events-none absolute inset-0 bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-300 rounded-xl" />
            <span className="relative flex items-center justify-center gap-2">
              {status === 'loading' ? (
                <>
                  <Spinner color="current" size="sm" />
                  Enviando...
                </>
              ) : (
                <>
                  <LuSend size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                  Solicitar cotización
                </>
              )}
            </span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-muted pt-0.5">
            <span className="flex items-center gap-1">
              <LuShieldCheck size={12} className="text-accent" />
              Datos seguros
            </span>
            <span>Sin compromiso</span>
            <span>Soporte 24/7</span>
          </div>
        </form>
      </div>
    </aside>
  );
}
