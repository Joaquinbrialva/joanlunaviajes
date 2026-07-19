'use client';

import { useState } from 'react';
import {
  RangeCalendar, Popover, Button, TextField, Input, TextArea, NumberField,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import {
  CalendarDays, X, MapPin, PlaneTakeoff, User, Mail, Phone,
  ArrowRight, Check, MessageSquare,
} from 'lucide-react';

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/* ─── Fecha de viaje — popover con calendario de rango ────────── */

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
      ? `${fmt(startDate)} → selecciona regreso…`
      : null;

  return (
    <Popover isOpen={open} onOpenChange={setOpen} placement="top-start">
      <Popover.Trigger>
        <button
          type="button"
          className={`w-full h-12 flex items-center gap-3 px-4 rounded-xl text-sm text-left bg-field-background border transition-colors ${
            open ? 'border-brand-primary/60' : 'border-border'
          } ${hasDate ? 'text-foreground' : 'text-field-placeholder'}`}
        >
          <CalendarDays size={15} className="text-brand-primary shrink-0" />
          <span className="flex-1 truncate">
            {label ?? 'Fechas de viaje (opcional)'}
          </span>
          {hasDate ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="p-1 rounded text-muted hover:bg-surface-tertiary transition-colors"
            >
              <X size={13} />
            </span>
          ) : (
            <span className="text-muted text-[11px] shrink-0">opcional</span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content>
        <Popover.Dialog>
          <RangeCalendar aria-label="Fechas de viaje" value={value} onChange={handleChange}>
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
              <p className="text-xs text-center pb-3 pt-1 text-muted">
                Ahora selecciona la fecha de regreso
              </p>
            )}
          </RangeCalendar>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/* ─── Campo con ícono — envuelve TextField/Input de HeroUI ─────── */

function IconField({ icon, children }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary z-10">
        {icon}
      </div>
      {children}
    </div>
  );
}

const inputClass = 'pl-10 pr-4 h-12 rounded-xl';

/* ─── Success state ──────────────────────────────────────────── */

function SuccessCard() {
  return (
    <div className="rounded-2xl p-10 flex flex-col items-center text-center bg-surface border border-border">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-success/12">
        <Check size={28} className="text-success" strokeWidth={2.5} />
      </div>
      <h3 className="text-2xl font-extrabold text-foreground mb-3">
        ¡Solicitud enviada!
      </h3>
      <p className="text-[13px] leading-relaxed text-muted max-w-[300px]">
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
  'Precios exclusivos que no encontrarás online',
];

export default function QuoteCTA() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');

  const up = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setErrMsg('El nombre es requerido.'); return; }
    setStatus('loading');
    setErrMsg('');

    const lines = [];
    if (form.origen) lines.push(`Origen: ${form.origen}`);
    if (form.destino) lines.push(`Destino: ${form.destino}`);
    if (form.startDate && form.endDate) lines.push(`Fechas: ${fmt(form.startDate)} → ${fmt(form.endDate)}`);
    else if (form.startDate) lines.push(`Salida: ${fmt(form.startDate)}`);
    if (form.mensaje) lines.push('', form.mensaje);

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre.trim(),
          email: form.email.trim(),
          phone: form.telefono.trim(),
          passengers: form.pasajeros,
          message: lines.join('\n'),
          wizardData: {
            origen: form.origen,
            destino: form.destino,
            startDate: form.startDate,
            endDate: form.endDate,
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
    <div id="cotizar" className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden bg-gradient-to-b from-surface-secondary to-brand-primary/[0.06]">
      <div className="relative py-24 max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-14 lg:gap-20 items-center">

          {/* ── Editorial izquierdo ──────────────────────────── */}
          <div>
            <h2
              className="font-extrabold text-foreground leading-[1.05] mb-6 tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.5rem)' }}
            >
              Tu próximo viaje,{' '}
              <span className="text-brand-primary">a tu medida.</span>
            </h2>

            <p className="leading-relaxed mb-10 text-[15px] text-muted max-w-[420px]">
              Completa el formulario y un asesor especializado te contactará con una propuesta
              totalmente personalizada — sin costo y sin compromiso.
            </p>

            <ul className="space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3.5">
                  <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 bg-brand-primary/12">
                    <Check size={11} className="text-brand-primary" strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] text-foreground/80">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Formulario ──────────────────────────────────── */}
          <div>
            {status === 'success' ? (
              <SuccessCard />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl overflow-hidden bg-surface border border-border shadow-xl shadow-black/[0.04]"
              >
                {/* Sección viaje */}
                <div className="px-7 pt-7 pb-6 space-y-3">
                  <p className="text-[12px] font-bold mb-4 text-muted uppercase tracking-wide">
                    Datos del viaje
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <IconField icon={<MapPin size={14} />}>
                      <TextField value={form.origen} onChange={(v) => up('origen', v)} aria-label="Origen" fullWidth>
                        <Input placeholder="Origen" className={inputClass} />
                      </TextField>
                    </IconField>
                    <IconField icon={<PlaneTakeoff size={14} />}>
                      <TextField value={form.destino} onChange={(v) => up('destino', v)} aria-label="Destino" fullWidth>
                        <Input placeholder="Destino" className={inputClass} />
                      </TextField>
                    </IconField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                    <DateRangePicker
                      startDate={form.startDate}
                      endDate={form.endDate}
                      onChange={({ start, end }) => setForm((prev) => ({ ...prev, startDate: start, endDate: end }))}
                    />

                    <NumberField
                      value={form.pasajeros}
                      onChange={(v) => up('pasajeros', v)}
                      minValue={1}
                      maxValue={20}
                      aria-label="Pasajeros"
                    >
                      <NumberField.Group className="h-12 rounded-xl w-[132px]">
                        <NumberField.DecrementButton aria-label="Menos pasajeros" />
                        <NumberField.Input className="text-sm text-center" />
                        <NumberField.IncrementButton aria-label="Más pasajeros" />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Sección contacto */}
                <div className="px-7 pt-6 pb-7 space-y-3">
                  <p className="text-[12px] font-bold mb-4 text-muted uppercase tracking-wide">
                    Tus datos de contacto
                  </p>

                  <IconField icon={<User size={14} />}>
                    <TextField value={form.nombre} onChange={(v) => up('nombre', v)} aria-label="Nombre completo" isRequired fullWidth>
                      <Input placeholder="Nombre completo *" className={inputClass} />
                    </TextField>
                  </IconField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <IconField icon={<Mail size={14} />}>
                      <TextField value={form.email} onChange={(v) => up('email', v)} aria-label="Email" fullWidth>
                        <Input type="email" placeholder="Email" className={inputClass} />
                      </TextField>
                    </IconField>
                    <IconField icon={<Phone size={14} />}>
                      <TextField value={form.telefono} onChange={(v) => up('telefono', v)} aria-label="Teléfono" fullWidth>
                        <Input type="tel" placeholder="Teléfono" className={inputClass} />
                      </TextField>
                    </IconField>
                  </div>

                  <IconField icon={<MessageSquare size={14} />}>
                    <TextField value={form.mensaje} onChange={(v) => up('mensaje', v)} aria-label="Detalle adicional" fullWidth>
                      <TextArea placeholder="¿Algún detalle adicional? (opcional)" rows={3} className="pl-10 pr-4 pt-3.5 rounded-xl resize-none" />
                    </TextField>
                  </IconField>

                  {errMsg && (
                    <p className="text-xs flex items-center gap-1.5 text-danger">
                      ⚠ {errMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    isDisabled={status === 'loading'}
                    color="primary"
                    className="w-full h-[52px] rounded-xl font-bold text-sm mt-1"
                  >
                    {status === 'loading' ? 'Enviando…' : (
                      <span className="flex items-center justify-center gap-2.5">
                        Solicitar cotización gratis
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-muted">
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
