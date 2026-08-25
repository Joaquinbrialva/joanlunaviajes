# Preview Hero Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two inconsistent "resumen" preview modals (destinos, ofertas) with a shared `PreviewModal` + `PreviewHero` (full-bleed hero) pair.

**Architecture:** Two new generic, presentation-only components in `frontend/components/admin/` — `preview-modal.jsx` (backdrop + centered container + Escape/scroll-lock) and `preview-hero.jsx` (full-bleed image hero with badges, title, meta, stat pills, close button). `destination-preview-drawer.jsx` and `offer-preview-drawer.jsx` are refactored to consume both, replacing their current containers (`AdminDrawer` and a hand-rolled split-panel modal respectively). Section content below the hero is untouched.

**Tech Stack:** Next.js (React, `'use client'` components), Tailwind CSS v4, `react-icons/lu` (Lucide icon set).

## Global Constraints

- No automated test suite exists in this repo (per `CLAUDE.md`) — verification is `npm run lint` plus manual check in the browser via `npm run dev`, not unit tests.
- `AdminDrawer` (`frontend/components/admin/admin-drawer.jsx`) must NOT be modified or removed — it's still used by `frontend/app/admin/usuarios/page.jsx`.
- Follow existing code style: no semicolons omitted, single quotes for JS strings in destination file, double quotes in offer file (match each file's existing convention when editing it), Tailwind utility classes inline, `// eslint-disable-next-line @next/next/no-img-element` above raw `<img>` tags.
- Path alias `@/` resolves to `frontend/`.

---

### Task 1: Create `PreviewModal` shell component

**Files:**
- Create: `frontend/components/admin/preview-modal.jsx`

**Interfaces:**
- Produces: `export default function PreviewModal({ isOpen, onClose, maxWidth = 'max-w-4xl', children })` — renders backdrop + centered animated container; does NOT render its own close button (that lives in `PreviewHero`, Task 2). Children are rendered inside a `flex flex-col h-[92vh] md:h-[85vh] max-h-[820px]` container.

- [ ] **Step 1: Write the component**

```jsx
'use client';

import { useEffect } from 'react';

export default function PreviewModal({ isOpen, onClose, maxWidth = 'max-w-4xl', children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`relative flex flex-col w-full ${maxWidth} rounded-3xl overflow-hidden shadow-2xl bg-surface transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} h-[92vh] md:h-[85vh] max-h-[820px]`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: no new errors referencing `preview-modal.jsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/preview-modal.jsx
git commit -m "feat: add PreviewModal shell for admin preview dialogs"
```

---

### Task 2: Create `PreviewHero` component

**Files:**
- Create: `frontend/components/admin/preview-hero.jsx`

**Interfaces:**
- Consumes: nothing from other tasks (standalone).
- Produces:
  - `export function StatusBadge({ children, variant })` — `variant` one of `'published' | 'draft' | 'featured' | 'popular' | 'special' | 'lowstock'`.
  - `export default function PreviewHero({ image, fallbackIcon: FallbackIcon = LuMapPin, eyebrow, title, meta = [], badges = [], stats = [], onClose })`
    - `meta`: array of `{ icon?: ComponentType, text: string }`, rendered under the title.
    - `badges`: array of `{ label: string, variant: string }`, rendered top-left over the image.
    - `stats`: array of `{ icon?: ComponentType, text: string, highlight?: string, highlightTone?: 'positive', tone?: 'danger' }`, rendered as glass pills at the bottom of the hero.

- [ ] **Step 1: Write the component**

```jsx
'use client';

import { LuX, LuMapPin } from 'react-icons/lu';

const badgeStyles = {
  published: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  draft:     'bg-white/10 text-white/60 border border-white/20',
  featured:  'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  popular:   'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  special:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  lowstock:  'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};

export function StatusBadge({ children, variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${badgeStyles[variant] || badgeStyles.draft}`}>
      {children}
    </span>
  );
}

export default function PreviewHero({
  image,
  fallbackIcon: FallbackIcon = LuMapPin,
  eyebrow,
  title,
  meta = [],
  badges = [],
  stats = [],
  onClose,
}) {
  return (
    <div className="relative h-56 md:h-72 shrink-0 overflow-hidden bg-zinc-900">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FallbackIcon className="h-14 w-14 text-white/20" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors"
      >
        <LuX className="h-4 w-4" />
      </button>

      {badges.length > 0 && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-4rem)]">
          {badges.map((b, i) => (
            <StatusBadge key={i} variant={b.variant}>{b.label}</StatusBadge>
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
        {eyebrow && (
          <p className="text-white/50 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-white font-bold text-2xl md:text-3xl leading-snug tracking-tight drop-shadow-sm">
          {title}
        </h2>
        {meta.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60 text-xs mt-2">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {m.icon && <m.icon className="h-3 w-3 shrink-0" />}
                {m.text}
              </span>
            ))}
          </p>
        )}
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {stats.map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 backdrop-blur-md border px-3 py-1.5 rounded-full text-xs font-bold ${s.tone === 'danger' ? 'bg-rose-500/20 border-rose-400/30 text-rose-300' : 'bg-white/10 border-white/15 text-white'}`}
              >
                {s.icon && <s.icon className="h-3 w-3" />}
                {s.text}
                {s.highlight && (
                  <span className={s.highlightTone === 'positive' ? 'text-emerald-400 text-[10px] font-bold' : 'text-[10px] font-normal opacity-70'}>
                    {s.highlight}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: no new errors referencing `preview-hero.jsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/preview-hero.jsx
git commit -m "feat: add PreviewHero full-bleed hero component"
```

---

### Task 3: Refactor `destination-preview-drawer.jsx`

**Files:**
- Modify: `frontend/components/admin/destination-preview-drawer.jsx` (full rewrite of imports + wrapping JSX; `Row`/`Section`/`TagList`/`StatBar` helpers and all `<Section>` content blocks stay as-is)

**Interfaces:**
- Consumes: `PreviewModal` (Task 1, default export, props `isOpen, onClose, maxWidth, children`), `PreviewHero` (Task 2, default export, props as documented above).
- Produces: `export default function DestinationPreviewDrawer({ destination, isOpen, onClose })` — same signature as before, no callers need to change (used from `frontend/app/admin/destinos/page.jsx`, already passing these three props — do not touch that file).

- [ ] **Step 1: Replace the full file contents**

```jsx
'use client';

import Link from 'next/link';
import { LuShield, LuThermometer, LuLanguages } from 'react-icons/lu';
import PreviewModal from './preview-modal';
import PreviewHero from './preview-hero';

function Row({ label, children }) {
  return (
    <div className='flex gap-4 py-2.5 border-b border-default last:border-0'>
      <span className='text-xs text-muted w-36 shrink-0 pt-0.5'>{label}</span>
      <span className='text-sm flex-1 min-w-0'>{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className='px-5 py-4 border-b border-default'>
      <p className='text-xs font-semibold text-muted uppercase tracking-wider mb-3'>{title}</p>
      {children}
    </div>
  );
}

function TagList({ items, color = 'orange' }) {
  if (!items?.length) return <span className='text-muted text-sm'>—</span>;
  const cls = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }[color];
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {items.map((item, i) => (
        <li key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{item}</li>
      ))}
    </ul>
  );
}

function StatBar({ label, value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      <div className='flex justify-between text-xs mb-1'>
        <span className='text-muted'>{label}</span>
        <span className='font-medium'>{value}</span>
      </div>
      <div className='h-1.5 rounded-full bg-surface-tertiary overflow-hidden'>
        <div className='h-full rounded-full bg-accent' style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DestinationPreviewDrawer({ destination, isOpen, onClose }) {
  if (!destination) return null;

  const ti = destination.travelInfo || {};
  const climate = destination.climate || {};
  const statsData = destination.stats || {};
  const seo = destination.seo || {};

  const badges = [
    {
      label: destination.status === 'published' ? 'Publicado' : 'Borrador',
      variant: destination.status === 'published' ? 'published' : 'draft',
    },
  ];
  if (destination.isPopular) badges.push({ label: '🔥 Popular', variant: 'popular' });
  if (destination.isFeatured) badges.push({ label: '⭐ Destacado', variant: 'featured' });

  const heroStats = [];
  if (statsData.safetyIndex != null) heroStats.push({ icon: LuShield, text: `Seguridad ${statsData.safetyIndex}` });
  if (climate.averageTemperatureC != null) heroStats.push({ icon: LuThermometer, text: `${climate.averageTemperatureC}°C` });
  if (ti.language) heroStats.push({ icon: LuLanguages, text: ti.language });

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose}>
      <PreviewHero
        image={destination.featuredImage}
        title={destination.name}
        meta={[{ text: [destination.country, destination.continent].filter(Boolean).join(' · ') }]}
        badges={badges}
        stats={heroStats}
        onClose={onClose}
      />

      <div className='flex-1 overflow-y-auto min-h-0'>
        {/* Identificación */}
        <Section title='Identificación'>
          <Row label='ID'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.id}</code></Row>
          <Row label='Slug'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.slug}</code></Row>
          <Row label='Descripción corta'><span className='text-muted'>{destination.shortDescription || '—'}</span></Row>
          <Row label='Creado'>{destination.createdAt ? new Date(destination.createdAt).toLocaleDateString('es-AR') : '—'}</Row>
          <Row label='Actualizado'>{destination.updatedAt ? new Date(destination.updatedAt).toLocaleDateString('es-AR') : '—'}</Row>
        </Section>

        {/* Info de viaje */}
        <Section title='Información de viaje'>
          <Row label='Aeropuerto (IATA)'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{ti.airport || '—'}</code></Row>
          <Row label='Moneda'>{ti.currency || '—'}</Row>
          <Row label='Idioma'>{ti.language || '—'}</Row>
          <Row label='Zona horaria'><span className='text-xs text-muted'>{ti.timezone || '—'}</span></Row>
          <Row label='Visa requerida'>{ti.visaRequired ? <span className='text-rose-600 font-medium'>Sí</span> : 'No'}</Row>
          <Row label='Estadía recomendada'>{ti.recommendedStayDays ? `${ti.recommendedStayDays} días` : '—'}</Row>
        </Section>

        {/* Clima */}
        <Section title='Clima'>
          <Row label='Tipo'>{climate.type || '—'}</Row>
          <Row label='Temperatura'>{climate.averageTemperatureC != null ? `${climate.averageTemperatureC}°C` : '—'}</Row>
          <Row label='Mejores meses'><TagList items={climate.bestMonthsToVisit} color='blue' /></Row>
        </Section>

        {/* Stats */}
        <Section title='Estadísticas'>
          <div className='space-y-3'>
            <StatBar label='Índice de seguridad' value={statsData.safetyIndex ?? 0} max={100} />
          </div>
          <div className='mt-3'>
            <Row label='Visitantes anuales'>{statsData.annualVisitorsMillions != null ? `${statsData.annualVisitorsMillions}M` : '—'}</Row>
            <Row label='Budget diario'>USD {statsData.averageDailyBudgetUSD ?? '—'}</Row>
          </div>
        </Section>

        {/* Contenido */}
        <Section title='Contenido editorial'>
          <div className='space-y-3'>
            <div>
              <p className='text-xs text-muted mb-1.5'>Highlights</p>
              <TagList items={destination.highlights} color='orange' />
            </div>
            <div>
              <p className='text-xs text-muted mb-1.5'>Estilos de viaje</p>
              <TagList items={destination.travelStyles} color='blue' />
            </div>
          </div>
        </Section>

        {/* SEO */}
        <Section title='SEO'>
          <Row label='Meta title'><span className='text-xs'>{seo.metaTitle || '—'}</span></Row>
          <Row label='Meta description'><span className='text-xs text-muted'>{seo.metaDescription || '—'}</span></Row>
        </Section>
      </div>

      {/* Acciones */}
      <div className='shrink-0 px-5 py-4 flex gap-2 border-t border-default bg-surface'>
        <Link
          href={`/admin/destinos/${destination.slug}/editar`}
          onClick={onClose}
          className='flex-1 h-9 flex items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-semibold'
        >
          Editar destino
        </Link>
        <Link
          href={`/destinos/${destination.slug}`}
          target='_blank'
          className='h-9 px-4 flex items-center justify-center rounded-lg border border-default text-sm hover:bg-surface-secondary transition-colors'
        >
          Ver pública →
        </Link>
      </div>
    </PreviewModal>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: no new errors referencing `destination-preview-drawer.jsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/destination-preview-drawer.jsx
git commit -m "refactor: rebuild destination preview modal on PreviewModal/PreviewHero"
```

---

### Task 4: Refactor `offer-preview-drawer.jsx`

**Files:**
- Modify: `frontend/components/admin/offer-preview-drawer.jsx` (full rewrite: drop local `StatusBadge` + backdrop/container markup + `useEffect`-based Escape/scroll-lock + mobile stats strip; keep `formatPrice`, `formatDate`, `buildLuggageItems`, `StarRating`, `SectionHeader`, and every content section unchanged)

**Interfaces:**
- Consumes: `PreviewModal` (Task 1), `PreviewHero` (Task 2, including its named export not needed here — only default).
- Produces: `export default function OfferPreviewDrawer({ offer, isOpen, onClose })` — same signature as before, no callers need to change (used from `frontend/app/admin/ofertas/page.jsx`).

- [ ] **Step 1: Replace the full file contents**

```jsx
'use client';

import Link from 'next/link';
import {
  LuX, LuMapPin, LuCalendar, LuClock, LuBriefcase,
  LuCheck, LuPlane, LuStar, LuBuilding, LuTag,
  LuPencil, LuArrowUpRight, LuPackage, LuPercent,
  LuInfo,
} from 'react-icons/lu';
import PreviewModal from './preview-modal';
import PreviewHero from './preview-hero';

/* ─── Helpers ───────────────────────────────────────────────── */

function formatPrice(amount, currency) {
  if (amount == null) return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function buildLuggageItems(luggage) {
  return [
    luggage?.personal && 'Artículo personal',
    luggage?.carryOn && 'Carry-on',
    luggage?.checked && 'Despachado',
  ].filter(Boolean);
}

/* ─── Sub-components ────────────────────────────────────────── */

function StarRating({ stars }) {
  if (!stars) return <span className="text-muted text-sm">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <LuStar
          key={i}
          className={`h-3 w-3 ${i < stars ? 'fill-amber-400 text-amber-400' : 'fill-surface-secondary text-surface-secondary'}`}
        />
      ))}
      <span className="ml-1.5 text-[11px] text-muted font-medium">{stars}/5</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
          <Icon className="h-3 w-3 text-accent" />
        </div>
      )}
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────── */

export default function OfferPreviewDrawer({ offer, isOpen, onClose }) {
  if (!offer) return null;

  const pricing      = offer.pricing      || {};
  const availability = offer.availability || {};
  const hotel        = offer.hotel        || {};
  const origin       = offer.origin       || {};
  const airline      = offer.airline      || {};
  const flight       = offer.flight       || {};
  const luggage      = offer.luggage      || {};
  const cover        = offer.images?.find((img) => img.isCover)?.url || offer.images?.[0]?.url;

  const mainPrice   = pricing.finalPrice || pricing.price;
  const origPrice   = pricing.originalPrice;
  const hasDiscount = origPrice && mainPrice && origPrice > mainPrice;
  const discountPct = hasDiscount
    ? (pricing.discountPercentage ?? Math.round(((origPrice - mainPrice) / origPrice) * 100))
    : null;
  const luggageItems = buildLuggageItems(luggage);
  const originCode   = origin.iata || origin.city?.slice(0, 3).toUpperCase() || '???';
  const destCode     = offer.location?.iata || offer.location?.city?.slice(0, 3).toUpperCase() || '???';

  const badges = [
    { label: offer.status === 'published' ? '● Publicado' : '○ Borrador', variant: offer.status === 'published' ? 'published' : 'draft' },
  ];
  if (offer.isFeatured) badges.push({ label: 'Destacada', variant: 'featured' });
  if (offer.isSpecialOffer) badges.push({ label: 'Especial', variant: 'special' });
  if (offer.isPopular) badges.push({ label: 'Popular', variant: 'popular' });
  if (availability.limitedSpots) badges.push({ label: 'Pocos cupos', variant: 'lowstock' });

  const heroMeta = [];
  if (offer.location) {
    const parts = [offer.location.city, offer.location.country].filter(Boolean).join(', ');
    heroMeta.push({ icon: LuMapPin, text: offer.location.airport ? `${parts} · ${offer.location.airport}` : parts });
  }

  const heroStats = [];
  if (mainPrice) {
    heroStats.push({
      text: formatPrice(mainPrice, pricing.currency),
      highlight: hasDiscount ? `-${discountPct}%` : undefined,
      highlightTone: 'positive',
    });
  }
  if (offer.duration?.days) heroStats.push({ icon: LuClock, text: `${offer.duration.days}d / ${offer.duration.nights}n` });
  if (availability.remainingSpots != null) {
    heroStats.push({
      text: `${availability.remainingSpots} cupos`,
      tone: availability.remainingSpots <= 3 ? 'danger' : undefined,
    });
  }

  return (
    <PreviewModal isOpen={isOpen} onClose={onClose}>
      <PreviewHero
        image={cover}
        fallbackIcon={LuMapPin}
        eyebrow={offer.subtitle}
        title={offer.title}
        meta={heroMeta}
        badges={badges}
        stats={heroStats}
        onClose={onClose}
      />

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 space-y-6">

          {/* ── Vuelo ── */}
          <div>
            <SectionHeader icon={LuPlane}>Vuelo</SectionHeader>
            <div className="rounded-2xl border border-default bg-surface-secondary/30 overflow-hidden">
              <div className="px-5 pt-4 pb-3 flex items-center gap-3">
                <div className="text-center min-w-[48px]">
                  <p className="text-2xl font-black tracking-tight font-mono leading-none">{originCode}</p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">{origin.city || origin.country || '—'}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-px border-t-2 border-dashed border-muted/25" />
                    <div className="mx-2 w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <LuPlane className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div className="flex-1 h-px border-t-2 border-dashed border-muted/25" />
                  </div>
                  <span className="text-[10px] text-muted font-medium">
                    {flight.type === 'stops'
                      ? flight.layover ? `Escala en ${flight.layover}` : 'Con escala'
                      : 'Directo'}
                  </span>
                </div>
                <div className="text-center min-w-[48px]">
                  <p className="text-2xl font-black tracking-tight font-mono leading-none">{destCode}</p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">{offer.location?.city || '—'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-2.5 border-t border-default bg-surface-secondary/50">
                {airline.name && (
                  <span className="flex items-center gap-2 text-xs">
                    {airline.iata && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://pics.avs.io/60/60/${airline.iata}.png`}
                        alt={airline.name}
                        className="h-6 w-6 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="font-semibold text-foreground">{airline.name}</span>
                    {airline.iata && (
                      <code className="text-[10px] font-mono bg-surface border border-default px-1.5 py-0.5 rounded text-muted">
                        {airline.iata}
                      </code>
                    )}
                  </span>
                )}
                {luggageItems.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <LuBriefcase className="h-3 w-3 text-accent/60 shrink-0" />
                    {luggageItems.join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Fechas ── */}
          {(availability.startDate || availability.endDate) && (
            <div>
              <SectionHeader icon={LuCalendar}>Fechas</SectionHeader>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-default bg-surface-secondary/30 p-3">
                  <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Salida</p>
                  <p className="text-sm font-bold">{formatDate(availability.startDate) || '—'}</p>
                </div>
                <div className="rounded-xl border border-default bg-surface-secondary/30 p-3">
                  <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">Regreso</p>
                  <p className="text-sm font-bold">{formatDate(availability.endDate) || '—'}</p>
                </div>
              </div>
              {offer.duration && (
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted mt-2">
                  <LuClock className="h-3 w-3" />
                  {offer.duration.days} días · {offer.duration.nights} noches
                </p>
              )}
            </div>
          )}

          {/* ── Precio ── */}
          {mainPrice && (
            <div>
              <SectionHeader icon={LuPercent}>Precio</SectionHeader>
              <div className="rounded-2xl border border-default bg-surface-secondary/30 p-4">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">
                      {pricing.pricePer || 'Por persona'}
                    </p>
                    <p className="text-3xl font-black tabular-nums tracking-tight">
                      {formatPrice(mainPrice, pricing.currency)}
                    </p>
                  </div>
                  {hasDiscount && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-muted line-through tabular-nums">
                        {formatPrice(origPrice, pricing.currency)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        -{discountPct}% OFF
                      </span>
                    </div>
                  )}
                </div>
                {pricing.price && pricing.finalPrice && pricing.price !== pricing.finalPrice && (
                  <p className="text-[11px] text-muted mt-2.5 pt-2.5 border-t border-default">
                    Precio base: <span className="font-medium">{formatPrice(pricing.price, pricing.currency)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Alojamiento ── */}
          {(hotel.name || hotel.stars) && (
            <div>
              <SectionHeader icon={LuBuilding}>Alojamiento</SectionHeader>
              <div className="rounded-2xl border border-default bg-surface-secondary/30 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-[15px] leading-snug">{hotel.name || '—'}</p>
                  <StarRating stars={hotel.stars} />
                </div>
                {hotel.address && (
                  <a
                    href={hotel.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(hotel.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
                  >
                    <LuMapPin className="h-3 w-3 shrink-0" />
                    {hotel.address}
                  </a>
                )}
                {hotel.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {hotel.amenities.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Incluye / No incluye ── */}
          {(offer.includes?.length > 0 || offer.notIncludes?.length > 0) && (
            <div>
              <SectionHeader icon={LuPackage}>Contenido</SectionHeader>
              <div className="grid grid-cols-2 gap-2.5">
                {offer.includes?.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-3">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2.5">Incluye</p>
                    <ul className="space-y-1.5">
                      {offer.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug">
                          <LuCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-px" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {offer.notIncludes?.length > 0 && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/60 dark:bg-rose-900/10 p-3">
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2.5">No incluye</p>
                    <ul className="space-y-1.5">
                      {offer.notIncludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug">
                          <LuX className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-px" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Highlights & Tags ── */}
          {(offer.highlights?.length > 0 || offer.tags?.length > 0) && (
            <div>
              <SectionHeader icon={LuTag}>Highlights & Tags</SectionHeader>
              {offer.highlights?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {offer.highlights.map((h, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-accent/10 text-accent border border-accent/20">
                      {h}
                    </span>
                  ))}
                </div>
              )}
              {offer.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {offer.tags.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-secondary text-muted border border-default">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Metadatos ── */}
          <div>
            <SectionHeader icon={LuInfo}>Metadatos</SectionHeader>
            <div className="rounded-xl border border-default bg-surface-secondary/20 divide-y divide-default overflow-hidden">
              {[
                { label: 'ID',          value: offer.id,               mono: true  },
                { label: 'Slug',        value: offer.slug,             mono: true  },
                { label: 'Categoría',   value: offer.category,         mono: false },
                { label: 'Creado',      value: formatDate(offer.createdAt),  mono: false },
                { label: 'Actualizado', value: formatDate(offer.updatedAt),  mono: false },
              ].filter((r) => r.value).map(({ label, value, mono }) => (
                <div key={label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-[11px] text-muted shrink-0 font-medium">{label}</span>
                  {mono ? (
                    <code className="text-[11px] font-mono bg-surface border border-default px-1.5 py-0.5 rounded text-foreground/70 truncate max-w-[200px]">
                      {value}
                    </code>
                  ) : (
                    <span className="text-[12px] truncate">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 border-t border-default px-4 py-3 flex gap-2.5 bg-surface">
        <Link
          href={`/admin/ofertas/${offer.slug}/editar`}
          onClick={onClose}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground text-[13px] font-semibold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
        >
          <LuPencil className="h-3.5 w-3.5" />
          Editar oferta
        </Link>
        <Link
          href={`/ofertas/${offer.slug}`}
          target="_blank"
          className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-default text-[13px] font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
        >
          Ver pública
          <LuArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PreviewModal>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: no new errors referencing `offer-preview-drawer.jsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/offer-preview-drawer.jsx
git commit -m "refactor: rebuild offer preview modal on PreviewModal/PreviewHero"
```

---

### Task 5: Manual browser verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: the running app at `http://localhost:3000/admin/destinos` and `http://localhost:3000/admin/ofertas`.

- [ ] **Step 1: Start both dev servers**

Run in `backend/`: `npm run dev`
Run in `frontend/`: `npm run dev`
Expected: backend on `http://localhost:4000`, frontend on `http://localhost:3000`.

- [ ] **Step 2: Verify destination preview modal**

Navigate to `http://localhost:3000/admin/destinos`, log in if needed, click a row's "ver" action to open `DestinationPreviewDrawer`. Confirm:
- Hero shows full-bleed image (or fallback icon on `bg-zinc-900` if no `featuredImage`), title, country/continent line, status/popular/featured badges top-left, close button top-right, and up to 3 stat pills (seguridad/temperatura/idioma) bottom of hero.
- Below the hero, all six sections (Identificación, Información de viaje, Clima, Estadísticas, Contenido editorial, SEO) render with the same content as before.
- Footer buttons "Editar destino" and "Ver pública →" work.
- Escape key and backdrop click close the modal.

- [ ] **Step 3: Verify offer preview modal**

Navigate to `http://localhost:3000/admin/ofertas`, open `OfferPreviewDrawer` for an offer that has a discount, limited spots, and a hotel. Confirm:
- Hero shows cover image, eyebrow (if `subtitle` set), title, location + airport meta line, badges (published/featured/special/popular/lowstock as applicable), and stat pills for price (with `-X%` highlight if discounted), duration, and cupos (red tone if ≤3).
- Below the hero, all sections (Vuelo, Fechas, Precio, Alojamiento, Incluye/No incluye, Highlights & Tags, Metadatos) render with the same content as before.
- Sticky footer buttons work.
- Open an offer with no cover image and confirm the fallback icon renders instead of a broken image.

- [ ] **Step 4: Check responsive behavior**

Resize the browser to a mobile width (~375px) for both modals. Confirm the hero, badges, and stat pills wrap/remain legible, and the modal still fits within the viewport without horizontal scroll.

- [ ] **Step 5: Report results**

If any visual issue is found, note the exact file/line and fix before considering the plan complete. No commit needed for this task (verification only).

---

## Self-Review Notes

- **Spec coverage:** `PreviewModal` (spec §Componentes nuevos) → Task 1. `PreviewHero` (spec §Componentes nuevos) → Task 2. Destination refactor (spec §Cambios en destination-preview-drawer.jsx) → Task 3. Offer refactor (spec §Cambios en offer-preview-drawer.jsx) → Task 4. `AdminDrawer` left untouched, confirmed via `grep` showing it's still used by `frontend/app/admin/usuarios/page.jsx` — no task touches it. Manual verification stands in for the spec's "fuera de alcance" boundary check.
- **Placeholder scan:** no TBD/TODO; every step contains full runnable code.
- **Type/name consistency:** `PreviewModal` and `PreviewHero` prop names match between their Task 1/2 definitions and their usage in Task 3/4 (`isOpen`, `onClose`, `maxWidth`, `image`, `fallbackIcon`, `eyebrow`, `title`, `meta`, `badges`, `stats`). `StatusBadge` variant strings (`published`, `draft`, `featured`, `popular`, `special`, `lowstock`) match between `preview-hero.jsx` and both call sites.
