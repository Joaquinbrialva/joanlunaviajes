'use client';

import { useEffect, useState } from 'react';
import { Button, TextField, Input, TextArea } from '@heroui/react';
import {
  ArrowLeftRight, PlaneTakeoff, PlaneLanding, User, Mail, Phone,
  ArrowRight, Check, MessageSquare,
} from 'lucide-react';
import DateRangeField from '@/components/inicio/ui/DateRangeField';
import PassengerPopover, { DEFAULT_PAX } from '@/components/inicio/ui/PassengerPopover';
import DestinationCombobox from '@/components/inicio/ui/DestinationCombobox';

const DATE_TRIGGER_CLASS = 'h-12 px-3.5 rounded-xl border border-border bg-field-background w-full flex items-center gap-2.5 text-left hover:border-accent/40 transition-colors';
const PAX_TRIGGER_CLASS = 'h-12 w-full rounded-xl border border-border bg-field-background px-3.5 flex items-center gap-2.5 text-left hover:border-accent/40 active:scale-[0.98] transition-[border-color,transform] duration-150';

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
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
  telefono: '', mensaje: '',
  tripType: 'roundtrip', startDate: '', endDate: '',
  pax: DEFAULT_PAX,
};

const BENEFITS = [
  'Respuesta en menos de 24 horas',
  'Sin costo ni compromiso',
  'Atención de expertos en cada destino',
  'Precios exclusivos que no encontrarás online',
];

export default function QuoteCTA() {
  const [form, setForm] = useState(INITIAL);
  const [destinations, setDestinations] = useState([]);
  const [swapSpins, setSwapSpins] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch('/api/destinos')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setDestinations(data);
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const destino = params.get('destino');
    if (destino) setForm((prev) => ({ ...prev, destino }));
  }, []);

  const destinoOptions = destinations.map((d) => ({ value: d.slug, label: `${d.city}, ${d.country}` }));

  function swapOrigenDestino() {
    setForm((prev) => ({ ...prev, origen: prev.destino, destino: prev.origen }));
    setSwapSpins((s) => s + 1);
  }

  const up = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setErrMsg('El nombre es requerido.'); return; }
    if (!form.email.trim() && !form.telefono.trim()) {
      setErrMsg('Dejanos un teléfono o email para contactarte.');
      return;
    }
    setStatus('loading');
    setErrMsg('');

    const { adultos, adolescentes, ninos, infantes } = form.pax;
    const passengers = adultos + adolescentes + ninos + infantes;

    const paxParts = [];
    if (adultos) paxParts.push(`${adultos} adulto${adultos === 1 ? '' : 's'}`);
    if (adolescentes) paxParts.push(`${adolescentes} adolescente${adolescentes === 1 ? '' : 's'}`);
    if (ninos) paxParts.push(`${ninos} niño${ninos === 1 ? '' : 's'}`);
    if (infantes) paxParts.push(`${infantes} infante${infantes === 1 ? '' : 's'}`);

    const origenNombre = destinations.find((d) => d.slug === form.origen)?.city || '';
    const destinoNombre = destinations.find((d) => d.slug === form.destino)?.city || '';

    const lines = [];
    if (origenNombre) lines.push(`Origen: ${origenNombre}`);
    if (destinoNombre) lines.push(`Destino: ${destinoNombre}`);
    lines.push(`Tipo de viaje: ${form.tripType === 'oneway' ? 'Solo ida' : 'Ida y vuelta'}`);
    if (form.tripType === 'roundtrip' && form.startDate && form.endDate) lines.push(`Fechas: ${fmt(form.startDate)} → ${fmt(form.endDate)}`);
    else if (form.startDate) lines.push(`Salida: ${fmt(form.startDate)}`);
    if (paxParts.length) lines.push(`Pasajeros: ${paxParts.join(', ')}`);
    if (form.mensaje) lines.push('', form.mensaje);

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre.trim(),
          email: form.email.trim(),
          phone: form.telefono.trim(),
          passengers,
          message: lines.join('\n'),
          destinationSlug: form.destino || null,
          wizardData: {
            origen: origenNombre,
            origenSlug: form.origen,
            destino: destinoNombre,
            destinoSlug: form.destino,
            tripType: form.tripType,
            startDate: form.startDate,
            endDate: form.endDate,
            pax: form.pax,
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
    <div id="cotizar" className="scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] items-stretch rounded-[28px] border border-border shadow-xl shadow-black/[0.06]">

        {/* ── Talón — stub del pasaje ──────────────────────── */}
        <div className="relative overflow-hidden rounded-t-[28px] lg:rounded-t-none lg:rounded-l-[28px] bg-brand-primary px-8 py-12 sm:px-10 sm:py-14 flex flex-col justify-center text-brand-primary-foreground">
          <PlaneTakeoff
            className="absolute -right-10 -bottom-10 text-brand-primary-foreground/[0.08] pointer-events-none hidden sm:block"
            size={220}
            strokeWidth={1}
            aria-hidden="true"
          />

          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-primary-foreground/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] mb-5">
            <MessageSquare size={12} strokeWidth={2.5} />
            Pasaje de cotización
          </span>
          <h2
            className="relative font-extrabold leading-[1.05] mb-5 tracking-tight"
            style={{ fontSize: 'clamp(1.9rem, 3vw, 2.5rem)' }}
          >
            Tu próximo viaje empieza acá.
          </h2>

          <p className="relative leading-relaxed mb-8 text-[14px] opacity-80 max-w-[320px]">
            Completá el pasaje y un asesor especializado te va a escribir con una propuesta
            armada a tu medida — sin costo y sin compromiso.
          </p>

          <ul className="relative space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 bg-brand-primary-foreground/15">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span className="text-[13px] opacity-90">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Formulario ──────────────────────────────────── */}
        <div className="relative bg-surface rounded-b-[28px] lg:rounded-b-none lg:rounded-r-[28px] flex items-center">
          {/* Perforación del pasaje */}
          <div className="hidden lg:block absolute inset-y-0 left-0 border-l border-dashed border-border" aria-hidden="true" />
          <span className="hidden lg:block absolute -top-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-background" aria-hidden="true" />
          <span className="hidden lg:block absolute -bottom-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-background" aria-hidden="true" />

          {status === 'success' ? (
            <div className="p-8 sm:p-12 w-full"><SuccessCard /></div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full"
            >
              {/* Sección viaje */}
              <div className="px-7 sm:px-10 pt-9 pb-6 space-y-3">
                <p className="text-[12px] font-bold mb-4 text-muted uppercase tracking-wide">
                  Datos del viaje
                </p>

                  <div className="relative inline-grid grid-cols-2 rounded-xl bg-surface-secondary p-1 gap-1">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-accent transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{ transform: form.tripType === 'oneway' ? 'translateX(calc(100% + 0.25rem))' : 'translateX(0)' }}
                    />
                    {[
                      { id: 'roundtrip', label: 'Ida y vuelta' },
                      { id: 'oneway', label: 'Solo ida' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => up('tripType', t.id)}
                        className={`relative z-10 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                          form.tripType === t.id ? 'text-accent-foreground' : 'text-muted hover:text-foreground'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
                    <DestinationCombobox
                      label="Origen"
                      icon={<PlaneTakeoff size={14} />}
                      value={form.origen}
                      options={destinoOptions}
                      onChange={(v) => up('origen', v)}
                      placeholder="Buscar origen..."
                    />

                    <div className="hidden sm:flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={swapOrigenDestino}
                        aria-label="Intercambiar origen y destino"
                        className="w-9 h-9 rounded-full border border-default bg-surface-secondary text-muted flex items-center justify-center hover:text-accent hover:border-accent/40 active:scale-90 transition-[color,border-color,transform] duration-200"
                      >
                        <ArrowLeftRight
                          size={15}
                          className="transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                          style={{ transform: `rotate(${swapSpins * 180}deg)` }}
                        />
                      </button>
                    </div>

                    <DestinationCombobox
                      label="Destino"
                      icon={<PlaneLanding size={14} />}
                      value={form.destino}
                      options={destinoOptions}
                      onChange={(v) => up('destino', v)}
                      placeholder="Buscar destino..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DateRangeField
                      label={form.tripType === 'roundtrip' ? 'Fechas de viaje' : 'Fecha ida'}
                      mode={form.tripType === 'roundtrip' ? 'range' : 'single'}
                      start={form.startDate}
                      end={form.endDate}
                      onApply={(start, end) => setForm((prev) => ({ ...prev, startDate: start || '', endDate: end || '' }))}
                      triggerClassName={DATE_TRIGGER_CLASS}
                    />

                    <PassengerPopover value={form.pax} onChange={(pax) => up('pax', pax)} triggerClassName={PAX_TRIGGER_CLASS} />
                  </div>
                </div>

                <div className="relative h-0 mx-7 sm:mx-10">
                  <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
                  <span className="absolute -left-[9px] -top-[9px] w-[18px] h-[18px] rounded-full bg-surface border border-border" aria-hidden="true" />
                  <span className="absolute -right-[9px] -top-[9px] w-[18px] h-[18px] rounded-full bg-surface border border-border" aria-hidden="true" />
                </div>

                {/* Sección contacto */}
                <div className="px-7 sm:px-10 pt-8 pb-9 space-y-3">
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
  );
}
