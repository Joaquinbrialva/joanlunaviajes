# Preview Fullscreen Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing centered `PreviewModal` (max-w-4xl) into a full-screen overlay, shrink `PreviewHero`, and reflow both preview drawers' content sections from a single stacked column into a responsive grid, cutting scroll and using the full screen width.

**Architecture:** This is a follow-up evolution of the already-shipped `PreviewModal`/`PreviewHero` pair (commits `8c0dd30`, `2be4814`, `9ce93b7`, `65f583b` on `dev`) — same two shared components, same two consumers, no new files. `PreviewModal` drops its centered-container styling for a full-viewport one; `PreviewHero` shrinks its fixed height; both drawers wrap their content sections in a CSS grid instead of a vertical stack.

**Tech Stack:** Next.js (React, `'use client'` components), Tailwind CSS v4, `react-icons/lu`.

## Global Constraints

- No automated test suite exists in this repo — verification is `npm run lint` plus manual browser check, not unit tests.
- `AdminDrawer` (`frontend/components/admin/admin-drawer.jsx`) must NOT be modified or removed.
- The `PreviewModal` component's `maxWidth` prop is removed entirely (no longer meaningful for a full-screen overlay). Neither consumer (`destination-preview-drawer.jsx`, `offer-preview-drawer.jsx`) currently passes `maxWidth`, so removing it requires no consumer changes.
- Component external signatures stay unchanged: `DestinationPreviewDrawer({ destination, isOpen, onClose })`, `OfferPreviewDrawer({ offer, isOpen, onClose })`.
- Follow each file's existing quote convention when editing it (single quotes in `destination-preview-drawer.jsx`, double quotes in `offer-preview-drawer.jsx` and `preview-hero.jsx`).

---

### Task 1: `PreviewModal` — full-screen overlay

**Files:**
- Modify: `frontend/components/admin/preview-modal.jsx` (full rewrite)

**Interfaces:**
- Produces: `export default function PreviewModal({ isOpen, onClose, children })` — the `maxWidth` prop is removed. Escape-key handling and body-scroll-lock behavior are unchanged. No backdrop element and no click-outside-to-close (there is no "outside" in a full-screen overlay) — closing is via the X button already rendered inside `PreviewHero`, or Escape.

- [ ] **Step 1: Replace the full file contents**

```jsx
'use client';

import { useEffect } from 'react';

export default function PreviewModal({ isOpen, onClose, children }) {
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
    <div className={`fixed inset-0 z-[70] bg-surface transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npm run lint`
Expected: no new errors referencing `preview-modal.jsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/preview-modal.jsx
git commit -m "feat: make PreviewModal a full-screen overlay"
```

---

### Task 2: `PreviewHero` — reduced height

**Files:**
- Modify: `frontend/components/admin/preview-hero.jsx` (single line change: root container height)

**Interfaces:**
- No prop or export changes. `export default function PreviewHero(...)` and `export function StatusBadge(...)` keep identical signatures.

- [ ] **Step 1: Replace the full file contents**

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
    <div className="relative h-40 md:h-56 shrink-0 overflow-hidden bg-zinc-900">
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
git commit -m "feat: reduce PreviewHero height for full-screen layout"
```

---

### Task 3: `destination-preview-drawer.jsx` — grid content layout

**Files:**
- Modify: `frontend/components/admin/destination-preview-drawer.jsx` (full rewrite: `Section` restyled as a standalone card, all six sections wrapped in a grid instead of stacked directly)

**Interfaces:**
- Consumes: `PreviewModal` (Task 1, now takes only `isOpen`, `onClose`, `children` — no `maxWidth`), `PreviewHero` (Task 2, same prop shape as before, height changed internally only).
- Produces: `export default function DestinationPreviewDrawer({ destination, isOpen, onClose })` — signature unchanged.

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
    <div className='rounded-2xl border border-default bg-surface-secondary/20 p-4'>
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5'>
          <Section title='Identificación'>
            <Row label='ID'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.id}</code></Row>
            <Row label='Slug'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{destination.slug}</code></Row>
            <Row label='Descripción corta'><span className='text-muted'>{destination.shortDescription || '—'}</span></Row>
            <Row label='Creado'>{destination.createdAt ? new Date(destination.createdAt).toLocaleDateString('es-AR') : '—'}</Row>
            <Row label='Actualizado'>{destination.updatedAt ? new Date(destination.updatedAt).toLocaleDateString('es-AR') : '—'}</Row>
          </Section>

          <Section title='Información de viaje'>
            <Row label='Aeropuerto (IATA)'><code className='text-xs font-mono bg-surface-secondary px-1.5 py-0.5 rounded'>{ti.airport || '—'}</code></Row>
            <Row label='Moneda'>{ti.currency || '—'}</Row>
            <Row label='Idioma'>{ti.language || '—'}</Row>
            <Row label='Zona horaria'><span className='text-xs text-muted'>{ti.timezone || '—'}</span></Row>
            <Row label='Visa requerida'>{ti.visaRequired ? <span className='text-rose-600 font-medium'>Sí</span> : 'No'}</Row>
            <Row label='Estadía recomendada'>{ti.recommendedStayDays ? `${ti.recommendedStayDays} días` : '—'}</Row>
          </Section>

          <Section title='Clima'>
            <Row label='Tipo'>{climate.type || '—'}</Row>
            <Row label='Temperatura'>{climate.averageTemperatureC != null ? `${climate.averageTemperatureC}°C` : '—'}</Row>
            <Row label='Mejores meses'><TagList items={climate.bestMonthsToVisit} color='blue' /></Row>
          </Section>

          <Section title='Estadísticas'>
            <div className='space-y-3'>
              <StatBar label='Índice de seguridad' value={statsData.safetyIndex ?? 0} max={100} />
            </div>
            <div className='mt-3'>
              <Row label='Visitantes anuales'>{statsData.annualVisitorsMillions != null ? `${statsData.annualVisitorsMillions}M` : '—'}</Row>
              <Row label='Budget diario'>USD {statsData.averageDailyBudgetUSD ?? '—'}</Row>
            </div>
          </Section>

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

          <Section title='SEO'>
            <Row label='Meta title'><span className='text-xs'>{seo.metaTitle || '—'}</span></Row>
            <Row label='Meta description'><span className='text-xs text-muted'>{seo.metaDescription || '—'}</span></Row>
          </Section>
        </div>
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
git commit -m "refactor: lay out destination preview sections in a grid"
```

---

### Task 4: `offer-preview-drawer.jsx` — grid content layout

**Files:**
- Modify: `frontend/components/admin/offer-preview-drawer.jsx` (full rewrite: content container changes from `p-5 space-y-6` stack to `p-5 grid` layout; the "Incluye/No incluye" block spans 2 grid columns on `md`+ since it already contains its own 2-column sub-grid; every other section stays a single grid cell; no section's internal content or conditional logic changes)

**Interfaces:**
- Consumes: `PreviewModal` (Task 1, `isOpen`/`onClose`/`children` only), `PreviewHero` (Task 2, unchanged prop shape).
- Produces: `export default function OfferPreviewDrawer({ offer, isOpen, onClose })` — signature unchanged.

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
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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
            <div className="md:col-span-2">
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
git commit -m "refactor: lay out offer preview sections in a grid"
```

---

### Task 5: Manual browser verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: the running app at `http://localhost:3000/admin/destinos` and `http://localhost:3000/admin/ofertas`.

- [ ] **Step 1: Confirm dev servers are running**

Backend on `http://localhost:4000`, frontend on `http://localhost:3000` (start with `npm run dev` in each of `backend/` and `frontend/` if not already running).

- [ ] **Step 2: Verify destination preview — full-screen + grid**

Open `http://localhost:3000/admin/destinos`, click a row's preview action. Confirm:
- The overlay covers the entire viewport (no visible page content or backdrop around it), no rounded corners/margins.
- Hero is visibly shorter than before but still shows image/fallback, badges, title, meta, stat pills.
- Below the hero, the six sections (Identificación, Información de viaje, Clima, Estadísticas, Contenido editorial, SEO) are arranged in a multi-column grid on a desktop-width window (2 columns ~768-1023px, 3 columns ≥1024px), each as its own bordered card, not one long stacked list.
- On a narrow (~375px) window, the grid collapses to a single column.
- Escape key and the X button both close the overlay back to the table.

- [ ] **Step 3: Verify offer preview — full-screen + grid**

Open `http://localhost:3000/admin/ofertas`, open the preview for an offer with both `includes` and `notIncludes` set. Confirm:
- Same full-screen overlay behavior as destinations.
- Sections (Vuelo, Fechas, Precio, Alojamiento, Incluye/No incluye, Highlights & Tags, Metadatos) lay out in the grid; "Incluye/No incluye" visibly spans 2 columns on a ≥768px window while the rest occupy a single column each.
- All previously-verified data (discount highlight pill, low-cupos danger tone, fallback icon when no cover image) still renders correctly — this logic didn't change in this plan, only its container.

- [ ] **Step 4: Report results**

If any visual issue is found, note the exact file/line and fix before considering the plan complete. No commit needed for this task (verification only).

---

## Self-Review Notes

- **Spec coverage:** Full-screen `PreviewModal` (spec §Detalle: PreviewModal full-screen) → Task 1. Reduced `PreviewHero` height (spec §Detalle: PreviewHero) → Task 2. Destination grid + card-style `Section` (spec §Detalle: grid de contenido) → Task 3. Offer grid with `md:col-span-2` on Incluye/No incluye (spec §Detalle: grid de contenido, "se permite que una sección ocupe 2 columnas... cuando el contenido lo pida") → Task 4. Manual verification of both full-screen behavior and grid responsiveness → Task 5.
- **Placeholder scan:** no TBD/TODO; every step contains full runnable code.
- **Type/name consistency:** `PreviewModal({ isOpen, onClose, children })` signature (Task 1) matches its usage in Task 3/4 (`<PreviewModal isOpen={isOpen} onClose={onClose}>...</PreviewModal>`, no `maxWidth` passed anywhere, consistent with the constraint that removing it needs no consumer changes). `PreviewHero` prop shape unchanged from the already-shipped version, so Task 3/4 usage needs no updates beyond what's already in the current files.
