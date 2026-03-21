'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { LuCheck, LuArrowRight, LuArrowLeft } from 'react-icons/lu';
import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
import DatePickerField from '@/components/ui/date-picker-field';
import { toastError } from '@/lib/toast';

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

const INITIAL = {
  // Paso 1
  destination: '',
  dateFlexibility: '',
  // Paso 2
  departureDate: '',
  returnDate: '',
  adults: 1,
  children: 0,
  // Paso 3
  tripType: '',
  budget: '',
  includes: [],
  // Paso 4
  name: '',
  email: '',
  phone: '',
  notes: '',
};

const TRIP_TYPES = ['Familia', 'Pareja', 'Luna de miel', 'Solo', 'Grupo de amigos', 'Corporativo'];

const BUDGET_OPTIONS = [
  { value: 'hasta-500',  label: 'Hasta $500' },
  { value: '500-1500',   label: '$500–$1500' },
  { value: '1500-3000',  label: '$1500–$3000' },
  { value: 'mas-3000',   label: '+$3000' },
  { value: 'flexible',   label: 'Flexible' },
];

const INCLUDES_OPTIONS = ['Vuelos', 'Hotel', 'Traslados', 'Excursiones', 'Seguro de viaje', 'Asistencia médica'];

const FLEXIBILITY_OPTIONS = [
  { value: 'fixed',    label: 'Sí, tengo fechas' },
  { value: 'flexible', label: 'Soy flexible' },
  { value: 'unknown',  label: 'No sé todavía' },
];

const FLEXIBILITY_LABELS = { fixed: 'Fechas fijas', flexible: 'Flexible', unknown: 'Sin definir todavía' };
const BUDGET_LABELS = Object.fromEntries(BUDGET_OPTIONS.map((o) => [o.value, o.label]));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/* ── Stepper ── */
function Stepper({ paso }) {
  const steps = ['Destino', 'Fechas', 'Preferencias', 'Contacto'];
  return (
    <div className="flex items-center gap-0 mb-8" style={syne}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < paso;
        const active = n === paso;
        return (
          <div key={label} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: done || active ? 'var(--accent)' : 'transparent',
                  border: done || active ? 'none' : '2px solid var(--border)',
                  color: done || active ? '#fff' : 'var(--muted)',
                }}
              >
                {done ? <LuCheck size={11} /> : n}
              </div>
              <span
                className="text-[11px] font-semibold hidden sm:block"
                style={{ color: active ? 'var(--accent)' : done ? 'var(--foreground)' : 'var(--muted)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-2 h-px"
                style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Chip selector ── */
function ChipGroup({ options, value, onChange, multi = false }) {
  function toggle(v) {
    if (multi) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange(value === v ? '' : v);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const selected = multi ? value.includes(val) : value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => toggle(val)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
            style={{
              borderColor: selected ? 'var(--accent)' : 'var(--border)',
              background: selected ? 'rgba(255,126,45,0.08)' : 'transparent',
              color: selected ? 'var(--accent)' : 'var(--muted)',
              fontFamily: 'var(--font-syne)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Counter ── */
function Counter({ label, value, onChange, min = 0, max = 20 }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2" style={syne}>{label}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg border border-default flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary transition-colors text-lg"
        >
          −
        </button>
        <span className="text-xl font-bold w-6 text-center" style={syne}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg border border-default flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary transition-colors text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}

const inputClass = 'w-full h-11 rounded-xl border border-default bg-surface px-4 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all';

/* ── Main page ── */
export default function CotizarPage() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* Validaciones por paso */
  const canGoNext = useMemo(() => {
    if (paso === 1) return form.destination.trim() !== '' && form.dateFlexibility !== '';
    if (paso === 2) {
      if (form.dateFlexibility !== 'fixed') return true;
      // ISO YYYY-MM-DD strings are lexicographically comparable
      return form.departureDate !== '' && form.returnDate !== '' && form.returnDate >= form.departureDate;
    }
    if (paso === 3) return true;
    if (paso === 4) return form.name.trim() !== '' && EMAIL_RE.test(form.email);
    return false;
  }, [paso, form.destination, form.dateFlexibility, form.departureDate, form.returnDate, form.name, form.email]);

  /* Construir message legible */
  function buildMessage() {
    const lines = ['Cotización a medida', ''];
    lines.push(`Destino: ${form.destination}`);
    lines.push(`Flexibilidad de fechas: ${FLEXIBILITY_LABELS[form.dateFlexibility] || ''}`);
    if (form.dateFlexibility === 'fixed' && form.departureDate) {
      lines.push(`Salida: ${formatDate(form.departureDate)} | Regreso: ${formatDate(form.returnDate)}`);
    }
    const viajeros = `${form.adults} adulto${form.adults !== 1 ? 's' : ''}${form.children > 0 ? `, ${form.children} niño${form.children !== 1 ? 's' : ''}` : ''}`;
    lines.push(`Viajeros: ${viajeros}`);
    if (form.budget) lines.push(`Presupuesto: ${BUDGET_LABELS[form.budget]} por persona`);
    if (form.tripType) lines.push(`Tipo de viaje: ${form.tripType}`);
    if (form.includes.length > 0) lines.push(`Incluye: ${form.includes.join(', ')}`);
    if (form.notes.trim()) lines.push(`Notas: ${form.notes.trim()}`);
    return lines.join('\n');
  }

  async function handleSubmit() {
    setSending(true);
    try {
      const wizardData = {
        destination: form.destination,
        dateFlexibility: form.dateFlexibility,
        departureDate: form.departureDate || null,
        returnDate: form.returnDate || null,
        adults: form.adults,
        children: form.children,
        tripType: form.tripType || null,
        budget: form.budget || null,
        includes: form.includes,
      };
      const passengers = form.adults + form.children;
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          passengers,
          message: buildMessage(),
          wizardData,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo enviar la consulta.');
      }
      setSubmitted(true);
    } catch (err) {
      toastError(err);
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setForm(INITIAL);
    setPaso(1);
    setSubmitted(false);
  }

  const todayDate = today(getLocalTimeZone());
  const returnMinDate = useMemo(() => {
    if (!form.departureDate) return todayDate;
    try { return parseDate(form.departureDate); } catch { return todayDate; }
  }, [form.departureDate, todayDate]);

  /* ── Pantalla de éxito ── */
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <LuCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-light text-foreground mb-3" style={cormorant}>
          ¡Tu consulta fue <em className="font-semibold">enviada!</em>
        </h1>
        <p className="text-sm text-muted mb-10" style={syne}>
          Te respondemos en menos de 24 horas con opciones personalizadas para tu viaje.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleReset}
            className="h-11 px-7 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-surface-secondary transition-colors"
            style={syne}
          >
            Hacer otra consulta
          </button>
          <Link
            href="/ofertas"
            className="h-11 px-7 rounded-full bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors flex items-center gap-2 justify-center"
            style={syne}
          >
            Ver ofertas disponibles <LuArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">

      {/* Hero */}
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent mb-3" style={syne}>
          Cotización a medida
        </p>
        <h1 className="text-4xl md:text-5xl font-light text-foreground mb-3 leading-tight" style={cormorant}>
          Arma tu viaje <em className="font-semibold">ideal</em>
        </h1>
        <p className="text-sm text-muted" style={syne}>
          Cuéntanos qué tienes en mente y te preparamos una propuesta personalizada.
        </p>
      </div>

      <Stepper paso={paso} />

      {/* ── Paso 1: Destino ── */}
      {paso === 1 && (
        <div className="space-y-6">
          <div>
            <p className="text-xl font-semibold text-foreground mb-5" style={syne}>¿A dónde quieres ir?</p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Destino *</label>
              <input
                autoFocus
                maxLength={120}
                className={inputClass}
                placeholder="Europa, Caribe, Tailandia... o 'Sorpréndeme'"
                value={form.destination}
                onChange={(e) => update('destination', e.target.value)}
                style={syne}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3" style={syne}>¿Tienes fechas en mente? *</p>
            <ChipGroup
              options={FLEXIBILITY_OPTIONS}
              value={form.dateFlexibility}
              onChange={(v) => update('dateFlexibility', v)}
            />
          </div>
        </div>
      )}

      {/* ── Paso 2: Fechas y viajeros ── */}
      {paso === 2 && (
        <div className="space-y-6">
          <p className="text-xl font-semibold text-foreground" style={syne}>¿Cuándo y con quién?</p>

          {form.dateFlexibility === 'fixed' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Fecha de salida *</label>
                <DatePickerField
                  value={form.departureDate}
                  onChange={(v) => update('departureDate', v)}
                  placeholder="Seleccionar"
                  minValue={todayDate}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Fecha de regreso *</label>
                <DatePickerField
                  value={form.returnDate}
                  onChange={(v) => update('returnDate', v)}
                  placeholder="Seleccionar"
                  minValue={returnMinDate}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-muted" style={syne}>
              Sin fechas fijas — lo coordinamos contigo.
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <Counter label="Adultos" value={form.adults} onChange={(v) => update('adults', v)} min={1} />
            <Counter label="Niños (opcional)" value={form.children} onChange={(v) => update('children', v)} min={0} />
          </div>
        </div>
      )}

      {/* ── Paso 3: Preferencias ── */}
      {paso === 3 && (
        <div className="space-y-6">
          <p className="text-xl font-semibold text-foreground" style={syne}>¿Cómo te imaginas el viaje?</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3" style={syne}>Tipo de viaje</p>
            <ChipGroup options={TRIP_TYPES} value={form.tripType} onChange={(v) => update('tripType', v)} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3" style={syne}>Presupuesto por persona (USD)</p>
            <ChipGroup options={BUDGET_OPTIONS} value={form.budget} onChange={(v) => update('budget', v)} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3" style={syne}>¿Qué querés que incluya? (opcional)</p>
            <ChipGroup options={INCLUDES_OPTIONS} value={form.includes} onChange={(v) => update('includes', v)} multi />
          </div>
        </div>
      )}

      {/* ── Paso 4: Contacto ── */}
      {paso === 4 && (
        <form onSubmit={(e) => { e.preventDefault(); if (canGoNext) handleSubmit(); }} className="space-y-4">
          <p className="text-xl font-semibold text-foreground" style={syne}>Último paso: ¿cómo te contactamos?</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Nombre *</label>
              <input className={inputClass} placeholder="Tu nombre" value={form.name} onChange={(e) => update('name', e.target.value)} style={syne} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Email *</label>
              <input type="email" className={inputClass} placeholder="tu@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} style={syne} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Teléfono / WhatsApp (opcional)</label>
            <input type="tel" className={inputClass} placeholder="+54 11 ..." value={form.phone} onChange={(e) => update('phone', e.target.value)} style={syne} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>¿Algo más que quieras contarnos? (opcional)</label>
            <textarea
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-default bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all resize-none"
              placeholder="Ej: viajamos con un bebé, queremos playa y montaña..."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              style={syne}
            />
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted" style={syne}>
            Te respondemos en menos de 24 horas con opciones personalizadas.
          </div>
        </form>
      )}

      {/* ── Botones de navegación ── */}
      <div className="flex justify-between mt-8">
        {paso > 1 ? (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="h-11 px-6 rounded-full border border-border text-sm font-semibold text-muted hover:text-foreground hover:bg-surface-secondary transition-colors flex items-center gap-2"
            style={syne}
          >
            <LuArrowLeft size={14} /> Anterior
          </button>
        ) : <div />}

        {paso < 4 ? (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setPaso((p) => p + 1)}
            className="h-11 px-8 rounded-full bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={syne}
          >
            Siguiente <LuArrowRight size={14} />
          </button>
        ) : (
          <Button
            isPending={sending}
            isDisabled={!canGoNext}
            onClick={handleSubmit}
            className="h-11 px-8 rounded-full bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-40"
            style={syne}
          >
            {({ isPending }) => isPending ? 'Enviando...' : 'Solicitar cotización'}
          </Button>
        )}
      </div>
    </div>
  );
}
