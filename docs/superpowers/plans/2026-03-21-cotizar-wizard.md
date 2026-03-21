# Cotizar Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public `/cotizar` page — a 4-step wizard that lets visitors describe their dream trip and submit a custom quote request to the admin panel.

**Architecture:** Wizard state is a flat object managed in a single `useState` in `page.jsx`. On submit, the frontend builds a human-readable `message` string and sends it alongside a structured `wizardData` JSON blob via `POST /api/cotizaciones`. The backend persists both in a new `wizardData Json?` Prisma field. The admin drawer shows a "Detalles del viaje" section when `wizardData` is present.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, `@heroui/react` v3, `@internationalized/date`, Express, Prisma, PostgreSQL.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Add `phone @default("")` and `wizardData Json?` to `Inquiry` model |
| `backend/src/routes/cotizaciones.js` | Modify | Relax phone validation, persist `wizardData`, improve notification subject |
| `frontend/components/ui/date-picker-field.jsx` | Modify | Accept and forward `minValue` prop to `<Calendar>` |
| `frontend/app/cotizar/page.jsx` | Create | Full 4-step wizard page |
| `frontend/components/inicio/ui/Navbar.jsx` | Modify | Update CTA to `/cotizar` in both desktop and mobile |
| `frontend/app/ofertas/page.jsx` | Modify | Add "¿No encontraste lo que buscás?" banner at bottom |
| `frontend/components/admin/inquiry-preview-drawer.jsx` | Modify | Add "Detalles del viaje" section when `wizardData` is present |

---

## Task 1: Prisma schema + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Edit schema — add `phone @default("")` and `wizardData Json?`**

Open `backend/prisma/schema.prisma`. Find the `Inquiry` model and make these two changes:

```prisma
model Inquiry {
  id              String   @id @default(uuid())
  name            String
  email           String   @default("")
  phone           String   @default("")    // ← was: phone String (no default)
  passengers      Int      @default(1)
  message         String   @default("")
  offerSlug       String?
  offerTitle      String?
  destinationSlug String?
  notes           String   @default("")
  status          String   @default("pending")
  userId          String?
  wizardData      Json?                    // ← new field
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name add-inquiry-wizard-data
```

Expected output: `Your database is now in sync with your schema.`
`migrate dev` automatically runs `prisma generate` — the Prisma Client is updated.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add wizardData field to Inquiry model"
```

---

## Task 2: Backend route changes

**Files:**
- Modify: `backend/src/routes/cotizaciones.js` lines 40–93

- [ ] **Step 1: Relax phone validation (line 47)**

Find:
```js
if (!name || !phone) {
  return res.status(400).json({ error: 'Completá nombre y teléfono.' });
}
```

Replace with:
```js
if (!name) {
  return res.status(400).json({ error: 'Completá tu nombre.' });
}
```

- [ ] **Step 2: Persist `wizardData` in `prisma.inquiry.create` (line 54)**

Find the `data: { ... }` block inside `prisma.inquiry.create`. Add `wizardData` after `userId`:

```js
const newInquiry = await prisma.inquiry.create({
  data: {
    name,
    email,
    phone,
    passengers: Math.max(1, Number(body.passengers || 1)),
    message: String(body.message || '').trim(),
    offerSlug: String(body.offerSlug || '').trim() || null,
    offerTitle: String(body.offerTitle || '').trim() || null,
    destinationSlug: String(body.destinationSlug || '').trim() || null,
    notes: '',
    status: 'pending',
    userId: req.user?.id || null,
    wizardData: body.wizardData ?? null,   // ← new
  },
});
```

- [ ] **Step 3: Improve notification subject (lines 71–75)**

Find:
```js
const subject = newInquiry.offerTitle
  ? `"${newInquiry.offerTitle}"`
  : newInquiry.destinationSlug
    ? newInquiry.destinationSlug.replace(/-/g, ' ')
    : 'consulta general';
```

Replace with:
```js
const subject = newInquiry.offerTitle
  ? `"${newInquiry.offerTitle}"`
  : newInquiry.destinationSlug
    ? newInquiry.destinationSlug.replace(/-/g, ' ')
    : newInquiry.wizardData?.destination
      ? `cotización a medida: ${newInquiry.wizardData.destination}`
      : 'consulta general';
```

- [ ] **Step 4: Verify backend starts without errors**

```bash
cd backend
npm run dev
```

Expected: server starts on port 4000, no errors in console.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/cotizaciones.js
git commit -m "feat: relax phone validation and persist wizardData in cotizaciones route"
```

---

## Task 3: Extend DatePickerField with minValue

**Files:**
- Modify: `frontend/components/ui/date-picker-field.jsx`

The `<Calendar>` component from `@heroui/react` accepts a `minValue` prop (a `CalendarDate` object from `@internationalized/date`). The wrapper currently doesn't expose it.

- [ ] **Step 1: Add `minValue` prop to component signature and pass to `<Calendar>`**

Open `frontend/components/ui/date-picker-field.jsx`. Make these changes:

```jsx
// Line 8 — add minValue to destructured props:
export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  triggerClassName,
  minValue,              // ← new prop (CalendarDate | null | undefined)
}) {
```

```jsx
// Line 40 — pass minValue to <Calendar>:
<Calendar
  value={calValue}
  minValue={minValue}    // ← new
  onChange={(date) => {
    onChange(date.toString());
    setOpen(false);
  }}
>
```

- [ ] **Step 2: Verify existing usages are unaffected**

Search for all usages of `DatePickerField` — the new prop is optional so existing uses without `minValue` continue to work unchanged.

```bash
cd frontend
grep -r "DatePickerField" --include="*.jsx" -l
```

Open each file and confirm no `minValue` is needed there.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ui/date-picker-field.jsx
git commit -m "feat: add minValue prop to DatePickerField"
```

---

## Task 4: Build the /cotizar wizard page

**Files:**
- Create: `frontend/app/cotizar/page.jsx`

This is the main task. The page is a `'use client'` component with:
- A flat form state object
- A `paso` (1–4) integer
- A `submitted` boolean for the success screen
- Four step-render functions

- [ ] **Step 1: Create the file with full implementation**

Create `frontend/app/cotizar/page.jsx`:

```jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { LuCheck, LuArrowRight } from 'react-icons/lu';
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
function Counter({ label, value, onChange, min = 0 }) {
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
          onClick={() => onChange(value + 1)}
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
  const canGoNext = (() => {
    if (paso === 1) return form.destination.trim() !== '' && form.dateFlexibility !== '';
    if (paso === 2) {
      if (form.dateFlexibility !== 'fixed') return true;
      return form.departureDate !== '' && form.returnDate !== '' && form.returnDate >= form.departureDate;
    }
    if (paso === 3) return true;
    if (paso === 4) return form.name.trim() !== '' && EMAIL_RE.test(form.email);
    return false;
  })();

  /* Construir message legible */
  function buildMessage() {
    const lines = ['Cotización a medida', ''];
    lines.push(`Destino: ${form.destination}`);
    lines.push(`Flexibilidad de fechas: ${FLEXIBILITY_LABELS[form.dateFlexibility] || ''}`);
    if (form.dateFlexibility === 'fixed' && form.departureDate) {
      lines.push(`Salida: ${form.departureDate} | Regreso: ${form.returnDate}`);
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
          Armá tu viaje <em className="font-semibold">ideal</em>
        </h1>
        <p className="text-sm text-muted" style={syne}>
          Contanos qué tenés en mente y te preparamos una propuesta personalizada.
        </p>
      </div>

      <Stepper paso={paso} />

      {/* ── Paso 1: Destino ── */}
      {paso === 1 && (
        <div className="space-y-6">
          <div>
            <p className="text-xl font-semibold text-foreground mb-5" style={syne}>¿A dónde querés ir?</p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted" style={syne}>Destino *</label>
              <input
                autoFocus
                className={inputClass}
                placeholder="Europa, Caribe, Tailandia... o 'Sorpréndeme'"
                value={form.destination}
                onChange={(e) => update('destination', e.target.value)}
                style={syne}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3" style={syne}>¿Tenés fechas en mente? *</p>
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
                  minValue={form.departureDate ? (() => { try { return parseDate(form.departureDate); } catch { return todayDate; } })() : todayDate}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-muted" style={syne}>
              Sin fechas fijas — lo coordinamos con vos.
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
          <p className="text-xl font-semibold text-foreground" style={syne}>¿Cómo te imaginás el viaje?</p>
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
        <div className="space-y-4">
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
              className="w-full rounded-xl border border-default bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all resize-none"
              placeholder="Ej: viajamos con un bebé, queremos playa y montaña..."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              style={syne}
            />
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted" style={syne}>
            📩 Te respondemos en menos de 24 horas con opciones personalizadas.
          </div>
        </div>
      )}

      {/* ── Botones de navegación ── */}
      <div className="flex justify-between mt-8">
        {paso > 1 ? (
          <button
            type="button"
            onClick={() => setPaso((p) => p - 1)}
            className="h-11 px-6 rounded-full border border-border text-sm font-semibold text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            style={syne}
          >
            ← Anterior
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
```

- [ ] **Step 2: Run dev server and manually test the wizard**

```bash
cd frontend
npm run dev
```

Open http://localhost:3000/cotizar and verify:
- Step 1: can't advance without destination + flexibility selection
- Step 2: date pickers appear only when "Sí, tengo fechas" selected; counters work
- Step 3: all chips toggle; multi-select works for includes
- Step 4: submit button disabled until name + valid email filled; on submit shows success screen; "Hacer otra consulta" resets all fields
- Network: POST /api/cotizaciones returns 201 with `wizardData` in response body

- [ ] **Step 4: Commit**

```bash
git add frontend/app/cotizar/page.jsx
git commit -m "feat: add /cotizar wizard page with 4-step form"
```

---

## Task 5: Update Navbar CTA

**Files:**
- Modify: `frontend/components/inicio/ui/Navbar.jsx` lines 148–155 and 291–298

- [ ] **Step 1: Update desktop CTA (lines 148–155)**

Find:
```jsx
<Link
  href="/consulta"
  className="h-8 px-4 rounded-full bg-accent text-white text-[13px] font-semibold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/25 flex items-center"
  style={syneStyle}
>
  Consultar ahora
</Link>
```

Replace with:
```jsx
<Link
  href="/cotizar"
  className="h-8 px-4 rounded-full bg-accent text-white text-[13px] font-semibold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/25 flex items-center"
  style={syneStyle}
>
  Cotizar a medida
</Link>
```

- [ ] **Step 2: Update mobile CTA (lines 291–298) — stays inside `!user` branch**

Find:
```jsx
{!isStaff && (
  <Link
    href="/consulta"
    onClick={() => setMobileOpen(false)}
    className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white"
  >
    Consultar ahora
  </Link>
)}
```

Replace with:
```jsx
{!isStaff && (
  <Link
    href="/cotizar"
    onClick={() => setMobileOpen(false)}
    className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white"
  >
    Cotizar a medida
  </Link>
)}
```

- [ ] **Step 3: Verify visually**

Open http://localhost:3000 and confirm:
- Desktop nav shows "Cotizar a medida" button linking to `/cotizar`
- Mobile menu shows "Cotizar a medida" when not logged in
- Staff/admin users don't see the button (existing behavior preserved)

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/ui/Navbar.jsx
git commit -m "feat: update navbar CTA to /cotizar"
```

---

## Task 6: Add banner to /ofertas page

**Files:**
- Modify: `frontend/app/ofertas/page.jsx`

- [ ] **Step 1: Find the end of the page content**

Open `frontend/app/ofertas/page.jsx`. Find where the main content ends — look for the closing `</div>` of the page wrapper or the pagination component.

- [ ] **Step 2: Add the banner before `</main>`**

The page structure ends with `</main>` at line ~384, followed by `</section>` and `</div>`. Insert the banner just before `</main>` (after the pagination block):

```jsx
{/* ── Banner: cotización a medida ── */}
<div className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 px-8 py-10 text-center">
  <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent mb-3" style={syne}>
    ¿No encontraste lo que buscás?
  </p>
  <h2 className="text-2xl md:text-3xl font-light text-foreground mb-3" style={cormorant}>
    Armá tu viaje <em className="font-semibold">a medida</em>
  </h2>
  <p className="text-sm text-muted mb-6 max-w-md mx-auto" style={syne}>
    Contanos el destino, fechas y presupuesto que tenés en mente y te preparamos una propuesta personalizada.
  </p>
  <Link
    href="/cotizar"
    className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-8 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
    style={syne}
  >
    Cotizar a medida <LuArrowRight size={14} />
  </Link>
</div>
```

Make sure `Link` from `next/link` and `LuArrowRight` from `react-icons/lu` are already imported at the top of the file (they are).

- [ ] **Step 3: Verify**

Open http://localhost:3000/ofertas, scroll to the bottom — the banner should appear.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/ofertas/page.jsx
git commit -m "feat: add cotizar a medida banner to /ofertas page"
```

---

## Task 7: Admin drawer — show wizardData section

**Files:**
- Modify: `frontend/components/admin/inquiry-preview-drawer.jsx`

- [ ] **Step 1: Add helper maps and the WizardDetails component at the top of the file**

After the existing `STATUS_CFG` constant (around line 16), add:

```jsx
const FLEXIBILITY_LABELS = {
  fixed: 'Fechas fijas',
  flexible: 'Flexible',
  unknown: 'Sin definir todavía',
};

const BUDGET_LABELS = {
  'hasta-500': 'Hasta $500',
  '500-1500': '$500–$1500',
  '1500-3000': '$1500–$3000',
  'mas-3000': '+$3000',
  flexible: 'Flexible',
};

function WizardDetails({ wizardData: w }) {
  const rows = [
    ['Destino', w.destination],
    ['Flexibilidad', FLEXIBILITY_LABELS[w.dateFlexibility]],
    w.departureDate ? ['Salida / Regreso', `${w.departureDate} → ${w.returnDate || '—'}`] : null,
    ['Viajeros', `${w.adults} adulto${w.adults !== 1 ? 's' : ''}${w.children > 0 ? `, ${w.children} niño${w.children !== 1 ? 's' : ''}` : ''}`],
    w.budget ? ['Presupuesto', BUDGET_LABELS[w.budget] + ' por persona'] : null,
    w.tripType ? ['Tipo de viaje', w.tripType] : null,
    w.includes?.length > 0 ? ['Incluye', w.includes.join(', ')] : null,
  ].filter(Boolean);

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
        Detalles del viaje solicitado
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--muted)', minWidth: 110, flexShrink: 0 }}>{label}</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render `WizardDetails` in the scrollable body**

Inside the `{/* ── Scrollable body ── */}` div, after the `{/* Solicitud */}` section and before the `{/* Contacto */}` section, add:

```jsx
{/* Detalles del wizard */}
{displayed.wizardData && <WizardDetails wizardData={displayed.wizardData} />}
```

- [ ] **Step 3: Verify with a test submission**

1. Go to http://localhost:3000/cotizar and submit a test wizard form.
2. Open http://localhost:3000/admin/cotizaciones.
3. Click the new inquiry — the drawer should show a "Detalles del viaje solicitado" section with all the wizard fields.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/admin/inquiry-preview-drawer.jsx
git commit -m "feat: show wizard details in inquiry preview drawer"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full end-to-end test**

With both servers running (`npm run dev` in `frontend/` and `backend/`):

1. Visit http://localhost:3000/cotizar
2. Complete all 4 steps — verify stepper updates, validation prevents advancing with empty fields
3. Submit — verify success screen appears
4. Click "Ver ofertas disponibles" — goes to `/ofertas`
5. Click "Hacer otra consulta" — all fields reset, wizard back to step 1
6. In admin panel: new inquiry appears, drawer shows "Detalles del viaje solicitado" section
7. Navbar shows "Cotizar a medida" on desktop and mobile
8. `/ofertas` page has banner at bottom

- [ ] **Step 2: Test existing cotizacion forms still work**

Submit a quote from `/contacto` (no wizardData) — verify it still works and the drawer shows no "Detalles del viaje" section.

- [ ] **Step 3: Final commit if any loose ends**

```bash
git add .
git commit -m "feat: complete /cotizar wizard — end-to-end verified"
```
