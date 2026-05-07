'use client';

import { useState } from 'react';
import { RangeCalendar, Popover } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import {
  CalendarDays, X, MapPin, PlaneTakeoff, User, Mail, Phone,
  Users, ArrowRight, Check, MessageSquare, ChevronRight,
} from 'lucide-react';

const syne      = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };
const grain     = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/* ─── Inline date range picker adapted for dark form ─────────── */

function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);

  const value =
    startDate && endDate
      ? { start: parseDate(startDate), end: parseDate(endDate) }
      : null;

  function handleChange(range) {
    onChange({ start: range.start.toString(), end: range.end.toString() });
    if (range.start && range.end) setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange({ start: '', end: '' });
  }

  const hasDate = Boolean(startDate || endDate);
  const label =
    startDate && endDate
      ? `${fmt(startDate)} → ${fmt(endDate)}`
      : startDate
      ? `${fmt(startDate)} → seleccioná regreso…`
      : null;

  return (
    <Popover isOpen={open} onOpenChange={setOpen} placement="top-start">
      <Popover.Trigger>
        <button
          type="button"
          className="w-full h-12 flex items-center gap-3 px-4 rounded-xl text-sm text-left transition-colors"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${open ? 'rgba(255,126,45,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: hasDate ? '#fff' : 'rgba(255,255,255,0.3)',
          }}
        >
          <CalendarDays size={15} style={{ color: '#ff7e2d', flexShrink: 0 }} />
          <span className="flex-1 truncate" style={syne}>
            {label ?? 'Fechas de viaje (opcional)'}
          </span>
          {hasDate ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="p-1 rounded transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <X size={13} />
            </span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }} className="shrink-0">
              opcional
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content>
        <Popover.Dialog>
          <RangeCalendar
            aria-label="Fechas de viaje"
            value={value}
            onChange={handleChange}
          >
            <RangeCalendar.Header>
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            {startDate && !endDate && (
              <p className="text-xs text-center pb-3 pt-1" style={{ color: 'var(--muted)' }}>
                Ahora seleccioná la fecha de regreso
              </p>
            )}
          </RangeCalendar>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/* ─── Dark-themed primitives ─────────────────────────────────── */

function DarkField({ icon, children }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#ff7e2d' }}>
        {icon}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontFamily: 'var(--font-syne)',
};

function DarkInput({ icon, placeholder, value, onChange, type = 'text', required }) {
  return (
    <DarkField icon={icon}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-12 pl-10 pr-4 rounded-xl text-sm placeholder:text-white/25 outline-none transition-colors"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(255,126,45,0.55)')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </DarkField>
  );
}

function DarkTextarea({ icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#ff7e2d' }}>
        {icon}
      </div>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full pl-10 pr-4 pt-3.5 pb-3 rounded-xl text-sm placeholder:text-white/25 outline-none resize-none transition-colors"
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(255,126,45,0.55)')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
      />
    </div>
  );
}

function PassengerStepper({ value, onChange }) {
  return (
    <div
      className="h-12 flex items-center rounded-xl overflow-hidden"
      style={inputStyle}
    >
      <div className="pl-3.5 pr-2.5 pointer-events-none" style={{ color: '#ff7e2d' }}>
        <Users size={15} />
      </div>
      <span className="flex-1 text-sm" style={{ color: value > 1 ? '#fff' : 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-syne)' }}>
        {value} pasajero{value !== 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="w-10 h-full flex items-center justify-center transition-colors disabled:opacity-20 hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        aria-label="Menos pasajeros"
      >
        −
      </button>
      <div className="w-px h-5 bg-white/10" />
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
        className="w-10 h-full flex items-center justify-center transition-colors disabled:opacity-20 hover:bg-white/10"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        aria-label="Más pasajeros"
      >
        +
      </button>
    </div>
  );
}

/* ─── Success state ──────────────────────────────────────────── */

function SuccessCard() {
  return (
    <div
      className="rounded-2xl p-10 flex flex-col items-center text-center"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'rgba(52,211,153,0.15)' }}
      >
        <Check size={28} style={{ color: '#34d399' }} strokeWidth={2.5} />
      </div>
      <h3
        className="text-3xl font-light text-white mb-3"
        style={cormorant}
      >
        ¡Solicitud enviada!
      </h3>
      <p className="text-[13px] leading-relaxed" style={{ ...syne, color: 'rgba(255,255,255,0.4)', maxWidth: 300 }}>
        Un asesor te va a contactar en las próximas 24 horas con tu cotización personalizada.
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

const INITIAL = {
  origen: '', destino: '', nombre: '', email: '',
  telefono: '', pasajeros: 1, mensaje: '',
  startDate: '', endDate: '',
};

const BENEFITS = [
  'Respuesta en menos de 24 horas',
  'Sin costo ni compromiso',
  'Atención de expertos en cada destino',
  'Precios exclusivos que no encontrás online',
];

export default function QuoteCTA() {
  const [form, setForm]     = useState(INITIAL);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');

  const up = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setErrMsg('El nombre es requerido.'); return; }
    setStatus('loading');
    setErrMsg('');

    const lines = [];
    if (form.origen)  lines.push(`Origen: ${form.origen}`);
    if (form.destino) lines.push(`Destino: ${form.destino}`);
    if (form.startDate && form.endDate)
      lines.push(`Fechas: ${fmt(form.startDate)} → ${fmt(form.endDate)}`);
    else if (form.startDate)
      lines.push(`Salida: ${fmt(form.startDate)}`);
    if (form.mensaje) lines.push('', form.mensaje);

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       form.nombre.trim(),
          email:      form.email.trim(),
          phone:      form.telefono.trim(),
          passengers: form.pasajeros,
          message:    lines.join('\n'),
          wizardData: {
            origen:    form.origen,
            destino:   form.destino,
            startDate: form.startDate,
            endDate:   form.endDate,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud.');
      setStatus('success');
      setForm(INITIAL);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.message);
      setTimeout(() => { setStatus('idle'); setErrMsg(''); }, 5000);
    }
  }

  return (
    <div id="cotizar" className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden">

      {/* Layers de fondo */}
      <div className="absolute inset-0 bg-[#0c1520]" />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-[#0c1520] to-slate-950/60" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-orange-500/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-sky-500/[0.03] blur-3xl pointer-events-none" />

      <div className="relative py-28 max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-14 lg:gap-20 items-center">

          {/* ── Editorial izquierdo ──────────────────────────── */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-8" style={{ background: 'rgba(255,126,45,0.5)' }} />
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ ...syne, color: 'rgba(255,163,80,0.55)' }}
              >
                Cotizador de viajes
              </span>
            </div>

            <h2
              className="font-light text-white leading-[1.06] mb-6"
              style={{ ...cormorant, fontSize: 'clamp(42px, 5vw, 62px)' }}
            >
              Tu próximo viaje,{' '}
              <em className="font-semibold" style={{ color: '#ff9a5c' }}>
                a tu medida.
              </em>
            </h2>

            <p
              className="leading-relaxed mb-10"
              style={{ ...syne, fontSize: 14, color: 'rgba(255,255,255,0.38)', maxWidth: 420 }}
            >
              Completá el formulario y un asesor especializado te contactará con una
              propuesta totalmente personalizada — sin costo y sin compromiso.
            </p>

            <ul className="space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3.5">
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,126,45,0.14)' }}
                  >
                    <ChevronRight size={11} style={{ color: '#ff7e2d' }} strokeWidth={2.5} />
                  </div>
                  <span style={{ ...syne, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{b}</span>
                </li>
              ))}
            </ul>

            {/* Decorative divider */}
            <div className="mt-14 flex items-center gap-4">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ ...syne, fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Joan Luna Viajes
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>

          {/* ── Formulario ──────────────────────────────────── */}
          <div>
            {status === 'success' ? (
              <SuccessCard />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Sección viaje */}
                <div className="px-7 pt-7 pb-6 space-y-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                    style={{ ...syne, color: 'rgba(255,255,255,0.22)' }}
                  >
                    Datos del viaje
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DarkInput
                      icon={<MapPin size={14} />}
                      placeholder="Origen"
                      value={form.origen}
                      onChange={(v) => up('origen', v)}
                    />
                    <DarkInput
                      icon={<PlaneTakeoff size={14} />}
                      placeholder="Destino"
                      value={form.destino}
                      onChange={(v) => up('destino', v)}
                    />
                  </div>

                  <DateRangePicker
                    startDate={form.startDate}
                    endDate={form.endDate}
                    onChange={({ start, end }) =>
                      setForm((prev) => ({ ...prev, startDate: start, endDate: end }))
                    }
                  />
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Sección contacto */}
                <div className="px-7 pt-6 pb-7 space-y-3">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4"
                    style={{ ...syne, color: 'rgba(255,255,255,0.22)' }}
                  >
                    Tus datos de contacto
                  </p>

                  <DarkInput
                    icon={<User size={14} />}
                    placeholder="Nombre completo *"
                    value={form.nombre}
                    onChange={(v) => up('nombre', v)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DarkInput
                      icon={<Mail size={14} />}
                      placeholder="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => up('email', v)}
                    />
                    <DarkInput
                      icon={<Phone size={14} />}
                      placeholder="Teléfono"
                      type="tel"
                      value={form.telefono}
                      onChange={(v) => up('telefono', v)}
                    />
                  </div>

                  <PassengerStepper
                    value={form.pasajeros}
                    onChange={(v) => up('pasajeros', v)}
                  />

                  <DarkTextarea
                    icon={<MessageSquare size={14} />}
                    placeholder="¿Algún detalle adicional? (opcional)"
                    value={form.mensaje}
                    onChange={(v) => up('mensaje', v)}
                  />

                  {errMsg && (
                    <p
                      className="text-xs flex items-center gap-1.5"
                      style={{ ...syne, color: '#f87171' }}
                    >
                      ⚠ {errMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 mt-1"
                    style={{
                      ...syne,
                      background: 'linear-gradient(135deg, #ff7e2d, #ff5500)',
                      color: '#fff',
                      boxShadow: '0 8px 28px rgba(255,126,45,0.4)',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {status === 'loading' ? (
                      'Enviando...'
                    ) : (
                      <>
                        Solicitar cotización gratis
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <p
                    className="text-center text-[11px]"
                    style={{ ...syne, color: 'rgba(255,255,255,0.18)' }}
                  >
                    Sin spam · Sin compromiso · Respuesta en 24 hs
                  </p>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
