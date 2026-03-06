# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend — run from `frontend/`
```bash
cd frontend
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

### Backend — run from `backend/`
```bash
cd backend
npm run dev      # http://localhost:4000  (node --watch)
npm start        # production
```

Both must run simultaneously during development. There are no automated tests.

## Architecture

Two separate apps: a **Next.js frontend** (`frontend/`) and an **Express backend** (`backend/`).

### Data layer

Data is persisted as JSON files in `backend/data/`. The module `backend/src/store/db.js` exposes async read/write helpers (using `node:fs`) and ID/slug utilities. **These files are the database** — no external DB is required.

- `data/offers.json` — travel packages (`id` format: `of-XXXX`)
- `data/destinations.json` — destinations (`id` format: `dest-XXX`)
- `data/inquiries.json` — quote/contact requests (`id` format: `inq-XXXX`)

### API (Express — port 4000)

| Method | Route | Description |
|---|---|---|
| GET | `/api/ofertas` | List all offers |
| GET | `/api/ofertas/:slug` | Get offer by slug |
| POST | `/api/ofertas` | Create offer |
| DELETE | `/api/ofertas/:id` | Delete offer |
| GET | `/api/destinos` | List all destinations |
| GET | `/api/destinos/:slug` | Get destination by slug |
| POST | `/api/destinos` | Create destination |
| DELETE | `/api/destinos/:id` | Delete destination |
| GET | `/api/cotizaciones` | List inquiries |
| POST | `/api/cotizaciones` | Create inquiry |
| PATCH | `/api/cotizaciones/:id` | Update inquiry status (`pending`/`contacted`/`closed`) |
| GET | `/health` | Health check |

### Frontend → Backend proxy

`frontend/next.config.mjs` rewrites all `/api/*` requests to `http://localhost:4000/api/*` (configurable via `BACKEND_URL` env var). **No frontend code needs to change** — all fetch calls still use `/api/...`.

### Frontend routing

| Route | Purpose |
|---|---|
| `/` | Public homepage |
| `/ofertas` | Public offer listing |
| `/ofertas/[slug]` | Offer detail |
| `/destinos` | Public destination listing |
| `/destinos/[slug]` | Destination detail |
| `/admin` | Admin dashboard |
| `/admin/ofertas` | Admin offer management |
| `/admin/ofertas/nueva` | Create offer form |
| `/admin/destinos` | Admin destination management |
| `/admin/destinos/nuevo` | Create destination form |
| `/admin/cotizaciones` | Quote inbox |

### Frontend component structure

```
components/
  inicio/
    sections/   # Homepage sections (Hero, Offers, Destinations, WhyChoose, NewsLetter, Footer)
    ui/         # Public-page UI (Navbar, Card, CollageGrid)
  ui/           # Shared primitives (button, pagination, slider, hero-select)
```

Path alias `@/` resolves to `frontend/` (defined in `jsconfig.json`).

### Styling

Tailwind CSS v4 with a custom design system defined via CSS variables in `globals.css`. Key tokens:

- `--accent` / `--accent-foreground` — brand orange (`#ff7e2d`)
- `--surface`, `--surface-secondary`, `--surface-tertiary` — layered surfaces
- `--background`, `--foreground`, `--muted`, `--border` — base semantics
- Dark mode via `next-themes` (`ThemeProvider`, attribute: `'class'`)
- Also imports `@heroui/styles` and shadcn-compatible variable names for component compatibility.

### Admin panel

`/admin` has its own layout (`app/admin/layout.jsx`) with a sidebar. Auth is enforced via `frontend/middleware.js` (cookie presence check) and verified on the backend via JWT middleware.

## Backlog de mejoras pendientes

Funcionalidades acordadas para implementar más adelante:

1. **Página `/cuenta` para clientes** — historial de cotizaciones, datos personales, cambio de contraseña.
2. **Formulario de cotización funcional** — desde la página pública de oferta (`/ofertas/[slug]`), que envíe al endpoint `POST /api/cotizaciones` y confirme al usuario.
3. **Galería real de imágenes** — subida de imágenes para ofertas y destinos (multer en backend + almacenamiento local o servicio externo).
4. **Notificaciones en el admin** — badge en el sidebar cuando llegan nuevas cotizaciones (polling o websocket).
5. **Edición de ofertas y destinos** — botón "Editar" en las tablas del admin que abra un formulario pre-cargado con los datos actuales (`PATCH /api/ofertas/:id`, `PATCH /api/destinos/:id`).
6. **Registro de nuevos usuarios** — página `/registro` para que clientes se creen una cuenta (validación de email único, hash de contraseña).
