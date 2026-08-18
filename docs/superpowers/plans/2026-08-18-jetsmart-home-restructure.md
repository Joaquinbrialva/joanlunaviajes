# JetSmart-Inspired Homepage Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the homepage navbar and section layout to match the visual rhythm of jetsmart.com's homepage (contained-width banner already done; now: navbar logo-left/always-solid, a compact offers row, and wiring in the already-built Destinations section), without inventing airline-specific content this site doesn't have.

**Architecture:** Four independent, sequential edits to existing files — no new components, no backend changes. `Navbar.jsx` drops its home-page transparency special-case and moves the logo to the leading position. `root-shell.jsx` drops the home-specific reduced top padding now that the navbar is never transparent. `Offers.jsx`'s card grid becomes a horizontal-scroll compact row. `page.js` adds the already-existing but never-wired `Destinations` component after `Offers`.

**Tech Stack:** Next.js (frontend only), Tailwind CSS v4, existing design tokens (`bg-surface`, `border-default`, `text-muted`, `text-foreground`, etc.).

**Spec:** `docs/superpowers/specs/2026-08-18-jetsmart-home-restructure-design.md`

## Global Constraints

- No automated test suite in this project — every task verifies with `npm run lint` plus a manual browser check against the running dev server (screenshot), matching how prior Hero work in this session was verified.
- Do not add mega-dropdowns to nav links, promotional tiles, blog, loyalty program, or alliance content — none of that exists on this site and none should be invented (per spec's "Fuera de alcance").
- The scroll-driven "island" floating-navbar effect (`isIsland`, controlled by `scrolled`) is unrelated to the home-page transparency being removed and must be preserved unchanged on all routes.
- Keep using the site's existing design tokens (`bg-surface`, `border-default`, `text-muted`, `text-foreground`, `bg-brand-primary`, etc.) — no new hardcoded colors.

---

### Task 1: Navbar — logo left, remove home-page transparency

**Files:**
- Modify: `frontend/components/inicio/ui/Navbar.jsx`

**Interfaces:**
- Produces: same default export `Navbar()` component, same props (none), same DOM structure otherwise (links, user menu, mobile menu, ThemeToggle) — only the background/text-color branching and logo position change. No other component imports or depends on Navbar's internals.

- [ ] **Step 1: Replace the file**

Replace the full contents of `frontend/components/inicio/ui/Navbar.jsx` with:

```jsx
'use client'
import ThemeToggle from "@/app/ThemeToggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuLayoutDashboard, LuLogOut, LuMenu, LuUser, LuX } from "react-icons/lu";
import Logo from "@/components/ui/logo";

const STAFF_ROLES = ['admin', 'agent', 'designer'];
const ROLE_LABELS = { admin: 'Administrador', agent: 'Agente', designer: 'Diseñador', client: 'Cliente' };

const NAV_LINKS = [
  { name: "Ofertas", url: "/ofertas" },
  { name: "Nosotros", url: "/nosotros" },
  { name: "Contacto", url: "/contacto" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const isStaff = user && STAFF_ROLES.includes(user.role);
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  // isIsland: forma island (padding + bordes redondeados + max-width) — solo al scrollear.
  // Efecto de scroll independiente del tema claro/oscuro de la barra — se mantiene en toda ruta.
  const isIsland = scrolled;

  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const dur = '420ms';
  const transition = `padding ${dur} ${ease}, max-width ${dur} ${ease}, border-radius ${dur} ${ease}, background-color ${dur} ${ease}, box-shadow ${dur} ${ease}, border-color ${dur} ${ease}`;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        paddingTop: isIsland ? '14px' : '0px',
        paddingLeft: isIsland ? '14px' : '0px',
        paddingRight: isIsland ? '14px' : '0px',
        transition,
      }}
    >
      {/* Island / full-width container — fondo sólido siempre, en toda ruta */}
      <div
        className="mx-auto backdrop-blur-2xl border bg-white/85 dark:bg-slate-950/85 border-slate-200/70 dark:border-white/[0.08] shadow-lg shadow-black/[0.06] dark:shadow-black/40"
        style={{
          maxWidth: isIsland ? '78rem' : '100vw',
          borderRadius: isIsland ? '1.25rem' : '0rem',
          transition,
        }}
      >

        {/* Main bar — logo a la izquierda, links, acciones a la derecha */}
        <div className="px-5 sm:px-8 flex items-center h-[72px] gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center select-none">
            <Logo className="h-12 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="flex-1 hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className="relative px-4 py-2 text-[13px] font-semibold tracking-wide rounded-full transition-colors duration-300 text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:bg-brand-primary/[0.06]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Columna derecha — Actions + ThemeToggle al final */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-2">
            {!authLoading && !isStaff && (
              <Link
                href="/cotizar"
                className="h-9 px-4 rounded-full bg-brand-primary text-brand-primary-foreground text-[13px] font-bold hover:opacity-90 transition-all shadow-md shadow-brand-primary/25 flex items-center"
              >
                Cotizar a medida
              </Link>
            )}

            {!authLoading && (
              user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border transition-all shadow-sm cursor-pointer border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
                  >
                    <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center text-[10px] font-bold">
                      {initials}
                    </span>
                    <span className="text-[13px] font-semibold transition-colors duration-300 text-slate-700 dark:text-slate-200">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-black/10 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role] || user.role}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href={isStaff ? '/admin' : '/cuenta'}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <LuLayoutDashboard className="w-4 h-4 text-brand-primary" />
                          {isStaff ? 'Panel de administración' : 'Mi cuenta'}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <LuLogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-semibold transition-all shadow-sm border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <LuUser className="w-3.5 h-3.5" />
                  Iniciar sesión
                </Link>
              )
            )}

            <ThemeToggle />
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Menú"
            >
              {mobileOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-white/5 px-4 pb-4 pt-3 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
              {!authLoading && (
                user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
                      </div>
                    </div>
                    <Link
                      href={isStaff ? '/admin' : '/cuenta'}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <LuLayoutDashboard className="w-4 h-4 text-brand-primary" />
                      {isStaff ? 'Panel de administración' : 'Mi cuenta'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LuLogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <LuUser className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                    {!isStaff && (
                      <Link
                        href="/cotizar"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white"
                      >
                        Cotizar a medida
                      </Link>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
```

Notes on what changed vs. the current file: `isHome`, `showBg`, and `active` are gone; every className that branched on `active`/`showBg` now keeps only the "solid background" branch (the one previously used when `showBg`/`active` were `true`); the `<Link href="/">Logo</Link>` block moved from between the nav and the actions column to before the `<nav>` (first child of the main bar row), so it's no longer visually centered.

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint components/inicio/ui/Navbar.jsx`
Expected: no output (clean).

- [ ] **Step 3: Manual browser verification**

With `frontend` (`npm run dev`) and `backend` (`npm run dev`) running:
1. Load `http://localhost:3000/` — confirm the navbar has a solid background immediately (not transparent), logo is on the left edge of the bar (not centered), links follow it, actions are on the right.
2. Scroll down past 60px — confirm the existing "island" floating effect (rounded corners, shrinking max-width, padding) still animates in, unchanged from before.
3. Load `http://localhost:3000/ofertas` (a non-home route) — confirm the navbar looks the same as on `/` (always solid, logo left) — this route already had `showBg=true` before, so this is a regression check that nothing else broke there.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/ui/Navbar.jsx
git commit -m "refactor: move navbar logo left, drop home-page transparency"
```

---

### Task 2: Unify home page top padding

**Files:**
- Modify: `frontend/components/ui/root-shell.jsx`

**Interfaces:**
- Consumes: none new. Produces: same `RootShell({ children })` component; only the computed padding class for the content wrapper `<div>` changes for the `/` route.

- [ ] **Step 1: Edit the padding ternary**

In `frontend/components/ui/root-shell.jsx`, change line 20 from:
```jsx
      <div className={`mx-auto max-w-7xl px-4 ${['/contacto', '/nosotros'].includes(pathname) ? 'pt-0' : pathname === '/' ? 'pt-4' : 'pt-[92px]'}`}>{children}</div>
```
to:
```jsx
      <div className={`mx-auto max-w-7xl px-4 ${['/contacto', '/nosotros'].includes(pathname) ? 'pt-0' : 'pt-[92px]'}`}>{children}</div>
```

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint components/ui/root-shell.jsx`
Expected: no output (clean).

- [ ] **Step 3: Manual browser verification**

Load `http://localhost:3000/` with both dev servers running — confirm there's no longer a large gap/overlap issue between the fixed navbar and the Hero banner (the banner's top edge should sit just below the navbar, same relationship you already see on `/ofertas` today between the navbar and that page's content).

- [ ] **Step 4: Commit**

```bash
git add frontend/components/ui/root-shell.jsx
git commit -m "refactor: give home the same top padding as other pages"
```

---

### Task 3: Restyle Offers into a compact horizontal row

**Files:**
- Modify: `frontend/components/inicio/sections/Offers.jsx`

**Interfaces:**
- Consumes: `GET /api/ofertas` (existing, unchanged response shape: array of offers with `slug, title, images[], pricing{price,finalPrice,originalPrice,discountPercentage,currency,pricePer}, location{city,country}, duration{days}, availability{startDate,endDate}, airline{name,iata}, isFeatured`).
- Produces: same default export `Offers()` — still safe to render anywhere in `page.js` with no props.

- [ ] **Step 1: Replace the file**

Replace the full contents of `frontend/components/inicio/sections/Offers.jsx` with:

```jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuArrowRight, LuClock3, LuMapPin, LuTicket } from 'react-icons/lu';

function getPrice(offer) {
  return offer.pricing?.price || offer.pricing?.finalPrice || offer.pricing?.originalPrice || 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
}

function OfferCard({ offer }) {
  const price = getPrice(offer);
  const hasPrice = price > 0;
  const cover = offer.images?.find((img) => img.isCover) || offer.images?.[0];
  const discount = offer.pricing?.discountPercentage;
  const currency = offer.pricing?.currency || 'USD';
  const originalPrice = offer.pricing?.originalPrice;
  const hasDiscount = discount > 0 && originalPrice && originalPrice > price;

  return (
    <Link href={`/ofertas/${offer.slug}`} className='group block h-full shrink-0 w-[240px] sm:w-[260px] snap-start'>
      <article className='h-full bg-surface rounded-2xl overflow-hidden flex flex-col border border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 hover:border-accent/25'>

        {/* Image */}
        <div className='relative overflow-hidden shrink-0' style={{ height: '140px' }}>
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={offer.title}
              fill
              sizes='260px'
              className='object-cover transition-transform duration-700 group-hover:scale-[1.07]'
            />
          ) : (
            <div className='absolute inset-0 bg-surface-tertiary' />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent' />

          {/* Location chip */}
          <div className='absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2 py-0.5'>
            <LuMapPin size={9} className='text-white/80 shrink-0' />
            <span className='text-white text-[10px] font-semibold truncate max-w-[120px]'>
              {offer.location?.city}, {offer.location?.country}
            </span>
          </div>

          {/* Badge */}
          {hasDiscount ? (
            <span className='absolute top-2 right-2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/30'>
              -{discount}%
            </span>
          ) : offer.isFeatured ? (
            <span className='absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full'>
              Destacada
            </span>
          ) : null}
        </div>

        {/* Content */}
        <div className='p-3 flex flex-col grow'>
          <h3
            className='leading-snug line-clamp-2 font-bold group-hover:text-accent transition-colors duration-300'
            style={{ fontSize: '0.875rem' }}
          >
            {offer.title}
          </h3>

          {offer.duration?.days > 0 && (
            <span className='flex items-center gap-1 text-[11px] text-muted mt-1.5'>
              <LuClock3 size={10} />
              {offer.duration.days} días
            </span>
          )}

          {/* Price row */}
          <div className='flex items-end justify-between gap-2 mt-auto pt-2.5 border-t border-border'>
            <div>
              {hasPrice && hasDiscount && originalPrice && (
                <p className='text-[11px] text-muted line-through leading-none mb-0.5'>
                  {currency} {formatNumber(originalPrice)}
                </p>
              )}
              {hasPrice ? (
                <p className='text-base font-bold text-accent leading-none'>
                  {currency} {formatNumber(price)}
                </p>
              ) : (
                <p className='text-xs font-medium text-muted italic'>Consultar</p>
              )}
              {offer.pricing?.pricePer && hasPrice && (
                <p className='text-[10px] text-muted mt-0.5'>/{offer.pricing.pricePer}</p>
              )}
            </div>
            <span className='text-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300 shrink-0'>
              <LuArrowRight size={16} />
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOffers(data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='space-y-8'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-2xl bg-brand-primary/12 flex items-center justify-center shrink-0'>
            <LuTicket size={22} className='text-brand-primary' />
          </div>
          <div>
            <h2 className='font-extrabold text-foreground leading-tight tracking-tight' style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
              Ofertas imperdibles
            </h2>
            <p className='text-[13px] text-muted mt-2 max-w-xs leading-relaxed'>
              Los paquetes más solicitados, listos para reservar hoy.
            </p>
          </div>
        </div>

        <Link
          href='/ofertas'
          className='hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-primary transition-colors group shrink-0'
        >
          Ver todas
          <LuArrowRight size={14} className='group-hover:translate-x-0.5 transition-transform' />
        </Link>
      </div>

      {loading ? (
        <OffersSkeleton />
      ) : offers.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-20 text-center rounded-2xl border border-dashed border-border'>
          <p className='font-semibold text-foreground'>Proximamente nuevas ofertas</p>
          <p className='text-sm text-muted'>Estamos preparando paquetes exclusivos. Vuelve pronto.</p>
        </div>
      ) : (
        <div className='flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory'>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      <div className='sm:hidden text-center'>
        <Link href='/ofertas' className='inline-flex items-center gap-2 text-sm font-semibold text-accent'>
          Ver todas las ofertas <LuArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function OffersSkeleton() {
  return (
    <div className='flex gap-4 overflow-x-auto pb-2 -mx-1 px-1'>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className='shrink-0 w-[240px] sm:w-[260px] rounded-2xl bg-surface border border-border overflow-hidden flex flex-col animate-pulse'>
          <div className='bg-surface-secondary' style={{ height: '140px' }} />
          <div className='p-3 flex flex-col gap-2.5'>
            <div className='h-3.5 w-3/4 rounded-full bg-border' />
            <div className='h-3 w-1/2 rounded-full bg-border' />
            <div className='pt-2.5 border-t border-border flex items-end justify-between'>
              <div className='h-5 w-20 rounded-full bg-border' />
              <div className='h-4 w-4 rounded-full bg-border' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Notes on what changed vs. the current file: the "stats strip" row (duration + airline logo, previously its own bordered sub-section between the image and the title) is gone — duration now renders as a small muted line directly under the title, and the airline name/logo is dropped from the card entirely (kept out of the compact card per the denser JetSmart-style layout; it's still visible on the offer detail page). The card width goes from a responsive grid column to a fixed `w-[240px] sm:w-[260px]` shrink-0 card in a horizontally scrollable flex row. The list shows up to 8 offers instead of 4, since a scrollable row can hold more than a 4-column grid's first visible batch.

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint components/inicio/sections/Offers.jsx`
Expected: no output (clean).

- [ ] **Step 3: Manual browser verification**

With both dev servers running, load `http://localhost:3000/` and scroll to "Ofertas imperdibles":
1. Confirm cards render in a single horizontally-scrollable row (not a wrapping grid), each ~240-260px wide.
2. Confirm each card shows: image with location chip and discount/featured badge, title, duration (if present), price, and the arrow icon — no separate airline/duration bordered strip.
3. Scroll the row horizontally (mouse wheel shift or drag) — confirm it scrolls smoothly and doesn't overflow the page horizontally.
4. Resize the browser to a narrow (mobile) width — confirm the row still scrolls horizontally and cards don't get squished below their fixed width.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/sections/Offers.jsx
git commit -m "redesign: restyle Offers into a compact horizontal-scroll row"
```

---

### Task 4: Wire the existing Destinations section into the homepage

**Files:**
- Modify: `frontend/app/page.js`

**Interfaces:**
- Consumes: `Destinations` default export from `frontend/components/inicio/sections/Destinations.jsx` (already exists, already self-contained — fetches its own data from `GET /api/destinos`, renders its own loading/empty states, takes no props). No changes to `Destinations.jsx` itself.

- [ ] **Step 1: Add the import and render it after Offers**

Replace the full contents of `frontend/app/page.js` with:

```jsx
'use client';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';
import Destinations from '@/components/inicio/sections/Destinations';
import HowItWorks from '@/components/inicio/sections/HowItWorks';
import QuoteCTA from '@/components/inicio/sections/QuoteCTA';

export default function Home() {
	return (
		<>
			<Hero />
			<div className="pt-20 sm:pt-28 space-y-24">
				<Offers />
				<Destinations />
				<HowItWorks />
				<QuoteCTA />
			</div>
		</>
	);
}
```

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint app/page.js`
Expected: no output (clean).

- [ ] **Step 3: Manual browser verification**

With both dev servers running, load `http://localhost:3000/` and scroll past "Ofertas imperdibles":
1. Confirm a "Destinos que enamoran" section now appears, before "Así funciona".
2. If there are published destinations in the DB, confirm they render in the collage grid; if there are none, confirm the "Próximamente nuevos destinos" empty state renders instead of an error or blank gap.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.js
git commit -m "feat: wire the existing Destinations section into the homepage"
```
