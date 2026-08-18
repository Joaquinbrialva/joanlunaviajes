# Hero Multi-Field Search Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hero's free-text search input with a compact multi-field widget (Destino / Fecha / Personas), inspired by jetsmart.com's flight-search layout but scoped to fields this travel-package business can actually fulfill, submitting to the existing `/ofertas` filters without any backend changes.

**Architecture:** One new self-contained component, `HeroSearchWidget.jsx`, that fetches its own destination options from `/api/ofertas`, holds its own local field state, and pushes to `/ofertas?dest=...&date=...&pax=...` on submit — reusing the exact query param names `/ofertas` (`frontend/app/ofertas/page.jsx`) already reads (`dest`, `date`). `Hero.jsx` swaps its inline `<form>` for `<HeroSearchWidget />` and drops the now-dead `query`/`handleSearch` code.

**Tech Stack:** Next.js, `@heroui/react` (`NumberField`), existing project components `HeroSelect` and `DatePickerField`.

**Spec:** `docs/superpowers/specs/2026-08-18-hero-search-widget-design.md`

## Global Constraints

- Do not modify `/ofertas` (`frontend/app/ofertas/page.jsx`) or the backend — the widget only builds a URL using query params that page already understands.
- No Origen/aeropuerto field, no Solo-ida/Ida-y-vuelta radio, no fecha de vuelta, no millas/código promocional, no airline-account tabs (Administra tu vuelo / Check-in / Estado del vuelo) — none of these have a real equivalent in this business, per spec's "Fuera de alcance".
- `pax` (Personas) is not read by `/ofertas` today and that's expected — it only needs to travel in the URL, not filter anything yet.
- Reuse existing components exactly as they already work in this codebase: `HeroSelect` (`frontend/components/ui/hero-select.jsx`, props `value`/`onValueChange`/`options`), `DatePickerField` (`frontend/components/ui/date-picker-field.jsx`, props `value`/`onChange`/`placeholder`/`triggerClassName`, value is a `YYYY-MM-DD` string), `NumberField` from `@heroui/react` (see `frontend/components/inicio/ui/QuoteForm.jsx:288-303` for the exact compound-component pattern already used in this codebase for a passenger counter).

---

### Task 1: Create the HeroSearchWidget component

**Files:**
- Create: `frontend/components/inicio/ui/HeroSearchWidget.jsx`

**Interfaces:**
- Produces: default export `HeroSearchWidget()` — a self-contained client component, no props. Renders its own card (`bg-surface`, `border-default`, shadow) containing the 3 fields + submit button. Consumed by Task 2's `Hero.jsx` change as `<HeroSearchWidget />`.
- Consumes: `GET /api/ofertas` (existing, unchanged) to derive the Destino dropdown's options — same derivation `/ofertas` itself already uses: unique `offer.location.country` values across all offers.

- [ ] **Step 1: Write the component**

Create `frontend/components/inicio/ui/HeroSearchWidget.jsx`:

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, NumberField } from '@heroui/react';
import { Minus, Plus } from 'lucide-react';
import HeroSelect from '@/components/ui/hero-select';
import DatePickerField from '@/components/ui/date-picker-field';

const FIELD_LABEL_CLASS = 'text-[10px] uppercase tracking-widest text-muted font-semibold block mb-1.5 ml-0.5';
const SELECT_TRIGGER_CLASS = 'h-11 rounded-xl border border-default bg-surface px-3 text-sm';
const DATE_TRIGGER_CLASS = 'h-11 px-3 rounded-xl border border-default w-full flex items-center gap-2 text-sm text-left hover:bg-surface-secondary transition-colors';

export default function HeroSearchWidget() {
	const [countries, setCountries] = useState([]);
	const [destino, setDestino] = useState('');
	const [fecha, setFecha] = useState('');
	const [personas, setPersonas] = useState(1);
	const router = useRouter();

	useEffect(() => {
		fetch('/api/ofertas')
			.then((r) => r.json())
			.then((data) => {
				if (!Array.isArray(data)) return;
				const unique = new Set(data.map((o) => o.location?.country).filter(Boolean));
				setCountries([...unique].sort());
			})
			.catch(() => {});
	}, []);

	const destinoOptions = [
		{ value: '', label: 'Cualquier destino' },
		...countries.map((c) => ({ value: c, label: c })),
	];

	function handleSubmit(e) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (destino) params.set('dest', destino);
		if (fecha) params.set('date', fecha);
		params.set('pax', String(personas));
		router.push(`/ofertas?${params.toString()}`);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-3 rounded-2xl bg-surface border border-default shadow-2xl shadow-black/20"
		>
			<div className="flex-1 min-w-0">
				<label className={FIELD_LABEL_CLASS}>Destino</label>
				<HeroSelect
					value={destino}
					onValueChange={setDestino}
					options={destinoOptions}
					triggerClassName={SELECT_TRIGGER_CLASS}
				/>
			</div>

			<div className="flex-1 min-w-0">
				<label className={FIELD_LABEL_CLASS}>Fecha</label>
				<DatePickerField
					value={fecha}
					onChange={setFecha}
					placeholder="Cualquier fecha"
					triggerClassName={DATE_TRIGGER_CLASS}
				/>
			</div>

			<div className="sm:w-36">
				<label className={FIELD_LABEL_CLASS}>Personas</label>
				<NumberField
					value={personas}
					onChange={(v) => setPersonas(isNaN(v) ? 1 : Math.max(1, v))}
					minValue={1}
					formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
				>
					<NumberField.Group className="h-11 rounded-xl border border-default flex items-center overflow-hidden bg-surface w-full">
						<NumberField.DecrementButton className="h-full px-3 hover:bg-surface-secondary border-r border-default flex items-center text-muted hover:text-foreground transition-colors">
							<Minus size={13} />
						</NumberField.DecrementButton>
						<NumberField.Input className="flex-1 h-full px-2 bg-transparent text-sm outline-none text-center font-semibold" />
						<NumberField.IncrementButton className="h-full px-3 hover:bg-surface-secondary border-l border-default flex items-center text-muted hover:text-foreground transition-colors">
							<Plus size={13} />
						</NumberField.IncrementButton>
					</NumberField.Group>
				</NumberField>
			</div>

			<Button type="submit" color="primary" className="shrink-0 rounded-xl px-6 h-11 font-semibold">
				{({ isPending }) => (isPending ? 'Buscando…' : 'Buscar')}
			</Button>
		</form>
	);
}
```

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint components/inicio/ui/HeroSearchWidget.jsx`
Expected: no output (clean).

- [ ] **Step 3: Manual verification**

No browser tooling assumed for this step — verify statically: re-read the file against this brief line by line, confirm `HeroSelect`'s props (`value`, `onValueChange`, `options`, `triggerClassName`) and `DatePickerField`'s props (`value`, `onChange`, `placeholder`, `triggerClassName`) match their real definitions in `frontend/components/ui/hero-select.jsx` and `frontend/components/ui/date-picker-field.jsx` exactly (open both files and compare). Confirm the `NumberField` compound usage matches the working reference at `frontend/components/inicio/ui/QuoteForm.jsx:288-303` structurally (same sub-components: `NumberField.Group`, `.DecrementButton`, `.Input`, `.IncrementButton`).

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/ui/HeroSearchWidget.jsx
git commit -m "feat: add HeroSearchWidget (destino/fecha/personas)"
```

---

### Task 2: Wire HeroSearchWidget into Hero.jsx

**Files:**
- Modify: `frontend/components/inicio/sections/Hero.jsx`

**Interfaces:**
- Consumes: `HeroSearchWidget` default export from Task 1 (`@/components/inicio/ui/HeroSearchWidget`), no props.

- [ ] **Step 1: Replace the search form with the widget, remove dead code**

In `frontend/components/inicio/sections/Hero.jsx`:

1. Add the import (after the existing `import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";` line), and remove `LuSearch` from that import since it's only used by the old inline form:
```jsx
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import HeroSearchWidget from '@/components/inicio/ui/HeroSearchWidget';
```

2. Remove the now-unused `query` state (`const [query, setQuery] = useState('');`) and the `useRouter` import/usage IF `router` ends up unused after removing `handleSearch` — check: `router` is only used inside `handleSearch`, so once `handleSearch` is removed, also remove `const router = useRouter();` and the `import { useRouter } from 'next/navigation';` line entirely (Hero.jsx no longer needs routing — the widget owns its own `useRouter()` call internally).

3. Remove the `handleSearch` function entirely:
```jsx
	function handleSearch(e) {
		e.preventDefault();
		const trimmed = query.trim();
		router.push(trimmed ? `/ofertas?q=${encodeURIComponent(trimmed)}` : '/ofertas');
	}
```

4. Replace the search form block:
```jsx
				<div className="relative z-10 -mt-6 flex justify-center px-2">
					<form
						onSubmit={handleSearch}
						className="w-full max-w-xl flex items-center gap-2 p-2 rounded-2xl bg-surface border border-default shadow-2xl shadow-black/20"
					>
						<LuSearch size={18} className="text-muted shrink-0 ml-2" />
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="¿A dónde quieres viajar? Roma, Cancún, Bariloche…"
							className="flex-1 h-11 min-w-0 outline-none text-sm text-foreground placeholder:text-muted bg-transparent"
							aria-label="Buscar destino u oferta"
						/>
						<Button type="submit" color="primary" className="shrink-0 rounded-xl px-5 h-11 font-semibold">
							{({ isPending }) => (isPending ? 'Buscando…' : 'Buscar')}
						</Button>
					</form>
				</div>
```
with:
```jsx
				<div className="relative z-10 -mt-6 flex justify-center px-2">
					<HeroSearchWidget />
				</div>
```

5. `Button` is still imported from `@heroui/react` at the top (`import { Button, Spinner } from '@heroui/react';`) but after this change Hero.jsx no longer renders a `Button` itself (the widget does). Narrow that import to `import { Spinner } from '@heroui/react';`.

The full resulting file should read exactly like this (shown in full so the executor doesn't have to hand-assemble the diffs above):

```jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '@heroui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import HeroSearchWidget from '@/components/inicio/ui/HeroSearchWidget';

const SLIDE_INTERVAL_MS = 5000;

export default function Hero() {
	// Sin imagen local por defecto: el loader tapa todo hasta que la media
	// de la DB (o su ausencia) queda resuelta.
	const [media, setMedia] = useState(null);
	const [mediaReady, setMediaReady] = useState(false);
	const [heroSettingsLoaded, setHeroSettingsLoaded] = useState(false);
	const [slides, setSlides] = useState(null); // null = aún no resuelto, [] = sin novedades
	const [slideIndex, setSlideIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const videoRef = useRef(null);

	useEffect(() => {
		fetch('/api/settings/hero')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => { if (data?.url) setMedia(data); })
			.catch(() => {})
			.finally(() => setHeroSettingsLoaded(true));

		fetch('/api/novedades')
			.then((r) => r.json())
			.then((data) => {
				const published = Array.isArray(data)
					? data.filter((u) => u.status === 'published' && u.images?.length > 0)
					: [];
				setSlides(published);
			})
			.catch(() => setSlides([]));
	}, []);

	const isCarousel = Array.isArray(slides) && slides.length > 0;
	const heroLoading = !heroSettingsLoaded || slides === null;

	useEffect(() => {
		const video = videoRef.current;
		if (!video || isCarousel) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) video.play().catch(() => {});
				else video.pause();
			},
			{ threshold: 0.25 }
		);
		observer.observe(video);
		return () => observer.disconnect();
	}, [media?.type, media?.url, isCarousel]);

	useEffect(() => {
		if (!isCarousel || paused || slides.length < 2) return;
		const t = setInterval(() => {
			setSlideIndex((i) => (i + 1) % slides.length);
		}, SLIDE_INTERVAL_MS);
		return () => clearInterval(t);
	}, [isCarousel, paused, slides?.length]);

	function goPrev() {
		setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
	}
	function goNext() {
		setSlideIndex((i) => (i + 1) % slides.length);
	}

	return (
		<div className="relative">
			<section
				className="relative overflow-hidden rounded-2xl bg-background"
				style={{ height: 'clamp(220px, 32vw, 400px)' }}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				{/* Fondo decorativo — se ve mientras no hay media resuelta */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-1/4 -left-1/4 w-[70%] aspect-square rounded-full bg-white/10 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
					<div className="absolute -bottom-1/3 -right-1/4 w-[65%] aspect-square rounded-full bg-black/15 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" />
				</div>

				{isCarousel ? (
					slides.map((novedad, i) => (
						<Image
							key={novedad.id}
							src={novedad.images[0]}
							alt=""
							fill
							priority={i === 0}
							quality={85}
							sizes="100vw"
							onLoad={() => { if (i === 0) setMediaReady(true); }}
							className={`object-cover transition-opacity duration-700 ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
						/>
					))
				) : media?.type === 'video' ? (
					<video
						ref={videoRef}
						key={media.url}
						autoPlay
						muted
						loop
						playsInline
						preload="metadata"
						poster={media.poster || undefined}
						onLoadedData={() => setMediaReady(true)}
						className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
					>
						<source src={media.url} />
					</video>
				) : media?.url ? (
					<Image
						src={media.url}
						alt="Destino de viaje"
						fill
						priority
						quality={85}
						sizes="100vw"
						onLoad={() => setMediaReady(true)}
						className={`object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
						style={media.focalPoint ? { objectPosition: `${media.focalPoint.x}% ${media.focalPoint.y}%` } : undefined}
					/>
				) : null}

				{isCarousel && slides.length > 1 && (
					<>
						<button
							type="button"
							onClick={goPrev}
							aria-label="Novedad anterior"
							className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
						>
							<LuChevronLeft size={22} />
						</button>
						<button
							type="button"
							onClick={goNext}
							aria-label="Siguiente novedad"
							className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
						>
							<LuChevronRight size={22} />
						</button>
					</>
				)}

				{/* Loader — capa opaca de tope, tapa todo hasta que la sección está lista */}
				<div
					className={`absolute inset-0 z-20 flex items-center justify-center bg-background transition-opacity duration-500 ${
						heroLoading || !mediaReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
					}`}
				>
					<Spinner size="lg" />
				</div>
			</section>

			{/* Card de búsqueda — superpuesta, se adapta al modo claro/oscuro via tokens del sitio */}
			<div className="relative z-10 -mt-6 flex justify-center px-2">
				<HeroSearchWidget />
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Lint**

Run from `frontend/`: `npx eslint components/inicio/sections/Hero.jsx`
Expected: no output (clean).

- [ ] **Step 3: Manual verification**

No browser tooling assumed — verify via `npm run dev` (frontend) + `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` returning 200 (confirms no SSR crash from the swapped import), plus a careful re-read of the diff against this brief. The controller will do the real browser click-through (open Destino dropdown, pick a date, adjust Personas, click Buscar, confirm it lands on `/ofertas?dest=...&date=...&pax=...` and that page's existing filter actually applies) separately, since that's the part static verification can't cover.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/sections/Hero.jsx
git commit -m "feat: wire HeroSearchWidget into the Hero, remove free-text search"
```
