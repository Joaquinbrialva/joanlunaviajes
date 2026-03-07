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

### Environment variables (backend)

Create `backend/.env`:
```
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
PORT=4000
```

## Architecture

Two separate apps: a **Next.js frontend** (`frontend/`) and an **Express backend** (`backend/`).

### Data layer

Data is persisted as JSON files in `backend/data/`. The module `backend/src/store/db.js` exposes async read/write helpers (using `node:fs`) and ID/slug utilities. **These files are the database** — no external DB is required.

- `data/offers.json` — travel packages (`id` format: `of-XXXX`)
- `data/destinations.json` — destinations (`id` format: `dest-XXX`)
- `data/inquiries.json` — quote/contact requests (`id` format: `inq-XXXX`)
- `data/users.json` — admin users (passwords hashed with bcryptjs)

Key exports from `db.js`: `db.offers`, `db.destinations`, `db.inquiries`, `db.users` (each with `.read()` / `.write(data)`), plus `nextOfferId`, `nextDestinationId`, `nextInquiryId`, `slugify`, `uniqueSlug`.

### API (Express — port 4000)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → sets `auth_token` HttpOnly cookie |
| POST | `/api/auth/logout` | Clears cookie |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/ofertas` | List all offers |
| GET | `/api/ofertas/:slug` | Get offer by slug |
| POST | `/api/ofertas` | Create offer |
| PATCH | `/api/ofertas/:id` | Update offer by id |
| DELETE | `/api/ofertas/:id` | Delete offer |
| GET | `/api/destinos` | List all destinations |
| GET | `/api/destinos/:slug` | Get destination by slug |
| POST | `/api/destinos` | Create destination |
| PATCH | `/api/destinos/:id` | Update destination by id |
| DELETE | `/api/destinos/:id` | Delete destination |
| GET | `/api/cotizaciones` | List inquiries |
| POST | `/api/cotizaciones` | Create inquiry |
| PATCH | `/api/cotizaciones/:id` | Update inquiry status (`pending`/`contacted`/`closed`) |
| GET | `/health` | Health check |

Auth middleware (`backend/src/middleware/auth.js`) verifies the `auth_token` JWT cookie via `requireAuth`.

### Frontend → Backend proxy

`frontend/next.config.mjs` rewrites all `/api/*` requests to `http://localhost:4000/api/*` (configurable via `BACKEND_URL` env var). All frontend fetch calls use `/api/...` — no hardcoded backend URLs.

### Frontend routing

| Route | Purpose |
|---|---|
| `/` | Public homepage |
| `/ofertas` | Public offer listing |
| `/ofertas/[slug]` | Offer detail |
| `/destinos` | Public destination listing |
| `/destinos/[slug]` | Destination detail |
| `/login` | Admin login |
| `/admin` | Admin dashboard |
| `/admin/ofertas` | Admin offer management |
| `/admin/ofertas/nueva` | Create offer (multi-step form) |
| `/admin/ofertas/[slug]/editar` | Edit offer (multi-step form, pre-filled) |
| `/admin/destinos` | Admin destination management |
| `/admin/destinos/nuevo` | Create destination form |
| `/admin/destinos/[slug]/editar` | Edit destination form |
| `/admin/cotizaciones` | Quote inbox |

Auth is enforced via `frontend/middleware.js` (cookie presence check on `/admin/*`).

### Frontend component structure

```
components/
  admin/          # Admin-only components (drawers: admin-drawer, offer-preview-drawer, destination-preview-drawer)
  inicio/
    sections/     # Homepage sections (Hero, Offers, Destinations, WhyChoose, NewsLetter, Footer)
    ui/           # Public-page UI (Navbar, Card, CollageGrid)
  ui/             # Shared primitives: button, pagination, slider, hero-select,
                  # item-list-input, country-combobox, airline-combobox,
                  # date-picker-field, range-date-picker-field
```

Path alias `@/` resolves to `frontend/` (defined in `jsconfig.json`).

### Styling

Tailwind CSS v4 with a custom design system defined via CSS variables in `globals.css`. Key tokens:

- `--accent` / `--accent-foreground` — brand orange (`#ff7e2d`)
- `--surface`, `--surface-secondary`, `--surface-tertiary` — layered surfaces
- `--background`, `--foreground`, `--muted`, `--border` — base semantics
- Dark mode via `next-themes` (`ThemeProvider`, attribute: `'class'`)
- Also imports `@heroui/styles` and shadcn-compatible variable names for component compatibility.

### UI components

Always prefer `@heroui/react` v3 (beta) components. Key compound component patterns:

- `Alert` → `<Alert><Alert.Indicator /><Alert.Content><Alert.Title /><Alert.Description /></Alert.Content></Alert>`
- `Button` → supports `isPending` and children render prop `{({ isPending }) => ...}`
- `Checkbox` → `<Checkbox><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Content /></Checkbox>`
- `NumberField` → `<NumberField><NumberField.Group>(.DecrementButton, .Input, .IncrementButton)</NumberField.Group></NumberField>`
- `Select` → `<Select><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox /></Select.Popover></Select>`
- `Spinner`, `Toast` (via `toast.success / toast.danger / toast.info` from `@heroui/react`)

### Toasts / Notifications

Use the centralized helper at `@/lib/toast.js`:
- `toastError(error, title?)` — accepts Error instance or string
- `toastSuccess(message, title?)`
- `toastInfo(message)`

`Toast.Provider` is mounted in `app/layout.js` via `components/ui/heroui-toast-provider.jsx`. Never use `alert()` or manual error state for user-facing notifications.

### Admin forms (multi-step pattern)

Create/edit forms for offers and destinations use a `paso` (step) state with a stepper UI. The form data is a flat object managed with a single `update(key, value)` helper. Validation runs on step transitions via `canGoNext` (useMemo). The edit pages fetch the existing record on mount and map it to the flat form shape via an `offerToForm` / `destinationToForm` converter.

### Backend list fields

Use `normalizeList(value)` (defined in route files) when processing list fields from request body — it handles both arrays and newline-separated strings. Do not use `splitLines()` alone, as it does not handle arrays.

## Backlog de mejoras pendientes

Funcionalidades acordadas para implementar más adelante:

1. **Página `/cuenta` para clientes** — historial de cotizaciones, datos personales, cambio de contraseña.
2. **Formulario de cotización funcional** — desde la página pública de oferta (`/ofertas/[slug]`), que envíe al endpoint `POST /api/cotizaciones` y confirme al usuario.
3. **Galería real de imágenes** — subida de imágenes para ofertas y destinos (multer en backend + almacenamiento local o servicio externo).
4. **Notificaciones en el admin** — badge en el sidebar cuando llegan nuevas cotizaciones (polling o websocket).
5. **Registro de nuevos usuarios** — página `/registro` para que clientes se creen una cuenta (validación de email único, hash de contraseña).
