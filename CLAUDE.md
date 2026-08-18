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

Both must run simultaneously during development. There are no automated tests wired into `npm test` (an ad-hoc `backend/test-flows.js` script exists but isn't run by any npm script).

### Environment variables (backend)

Create `backend/.env` (see `backend/.env.example`):
```
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...        # Supabase Postgres, pooled connection
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...
MAIL_USER=
MAIL_APP_PASSWORD=
MAIL_TO=
WHATSAPP_NUMBER=
```

## Architecture

Two separate apps: a **Next.js frontend** (`frontend/`) and an **Express backend** (`backend/`).

### Data layer

Data is persisted in **Postgres (hosted on Supabase)** via **Prisma**. `backend/prisma/schema.prisma` defines the models: `Offer`, `Destination`, `Inquiry`, `User`, `Subscriber`, `Update` (all UUID ids). `Update` is the "Novedades" feature — photo albums with an optional caption, publicly shown on the homepage below the Hero. `backend/src/store/prisma.js` exports the `prisma` client (plus a `withRetry` helper for transient connection errors). There is no `prisma/migrations` history — schema changes are applied with `npm run db:push` (Prisma db push), not versioned migrations.

Uploaded images/video (offer/destination galleries, hero media) go to **Supabase Storage** (`images` bucket, public) via `backend/src/store/supabase.js` — not local disk.

Backend npm scripts of note: `db:generate`, `db:push`, `db:migrate` (prisma migrate deploy), `db:seed` (`scripts/seed.js`), `db:studio`.

### API (Express — port 4000)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → sets `auth_token` HttpOnly cookie |
| POST | `/api/auth/logout` | Clears cookie |
| GET | `/api/auth/me` | Get current user (requires auth) |
| PATCH | `/api/auth/me` | Update own profile / change password |
| GET | `/api/ofertas` | List all offers |
| GET | `/api/ofertas/:slug` | Get offer by slug |
| POST | `/api/ofertas` | Create offer (admin/agent) |
| PATCH | `/api/ofertas/:id` | Update offer by id (admin/agent) |
| DELETE | `/api/ofertas/:id` | Delete offer (admin/agent) |
| GET | `/api/destinos` | List all destinations |
| GET | `/api/destinos/:slug` | Get destination by slug |
| POST | `/api/destinos` | Create destination (admin/agent) |
| PATCH | `/api/destinos/:id` | Update destination by id (admin/agent) |
| DELETE | `/api/destinos/:id` | Delete destination (admin/agent) |
| GET | `/api/novedades` | List novedades (all for staff, published-only for public) |
| POST | `/api/novedades` | Create novedad (admin/agent/designer) |
| PATCH | `/api/novedades/:id` | Update novedad by id (admin/agent/designer) |
| DELETE | `/api/novedades/:id` | Delete novedad by id (admin/agent/designer) |
| GET | `/api/cotizaciones` | List inquiries (admin/agent) |
| GET | `/api/cotizaciones/mis` | Inquiries for the logged-in user |
| GET | `/api/cotizaciones/:id` | Get one inquiry (staff, or owner by userId/email) |
| POST | `/api/cotizaciones` | Create inquiry (public, rate-limited) |
| PATCH | `/api/cotizaciones/:id` | Update inquiry status/notes (admin/agent only) |
| DELETE | `/api/cotizaciones/:id` | Delete inquiry (admin/agent only) |
| GET/POST/PATCH/DELETE | `/api/users` | Admin user management (admin only) |
| POST | `/api/upload` | Upload a single image to Supabase Storage (any authed user) |
| POST | `/api/upload/media` | Upload hero image/video (admin/agent/designer) |
| GET | `/api/settings/hero` | Public — current homepage hero media |
| PATCH | `/api/settings/hero` | Update hero media (admin/agent/designer) |
| GET | `/health` | Health check |

Auth middleware (`backend/src/middleware/auth.js`): `requireAuth` (any logged-in user), `optionalAuth` (attaches `req.user` if present, doesn't block), `requireRole(...roles)` (returns a `[requireAuth, checker]` array — mount with `...requireRole(...)` in route definitions).

Roles: `admin`, `agent`, `designer`, `client`. Keep the role list in sync across `backend/src/routes/users.js` (`VALID_ROLES`), `backend/src/routes/upload.js` / `settings.js` (`ALLOWED_ROLES`), and `frontend/app/admin/usuarios/page.jsx` (`ROLES`) — they've drifted before.

There is no `Notification` model and no `/api/notifications/*` route. `frontend/components/admin/notification-bell.jsx` still polls those endpoints and will silently no-op (this is known and intentionally left as-is for now, not a bug to "fix" reflexively).

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
| `/cotizar` | Public quote wizard (posts to `POST /api/cotizaciones`) |
| `/consulta` | Contact form |
| `/contacto` | Contact page |
| `/login` | Login (all roles) |
| `/registro`, `/registro/verificar` | Client sign-up + email verification |
| `/olvide-contrasena`, `/olvide-contrasena/restablecer` | Password reset flow |
| `/cambiar-contrasena` | Forced password change (`mustChangePassword`) |
| `/cuenta` | Client account — profile + own inquiries |
| `/cuenta/cotizaciones/[id]` | Client view of a single inquiry |
| `/admin` | Admin dashboard |
| `/admin/ofertas` | Admin offer management |
| `/admin/ofertas/nueva` | Create offer (multi-step form) |
| `/admin/ofertas/[slug]/editar` | Edit offer (multi-step form, pre-filled) |
| `/admin/destinos` | Admin destination management |
| `/admin/destinos/nuevo` | Create destination form |
| `/admin/destinos/[slug]/editar` | Edit destination form |
| `/admin/novedades` | Admin novedades management (photo albums shown on homepage) |
| `/admin/cotizaciones` | Quote inbox |
| `/admin/usuarios` | User management (admin only) |
| `/admin/perfil` | Own profile |
| `/admin/ajustes` | Settings |
| `/admin/apariencia` | Hero media / appearance settings |

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

1. **Notificaciones en el admin** — `NotificationBell` en el frontend ya está construido y pollea `/api/notifications*`, pero ese backend nunca se migró de la era JSON-store a Prisma: no existe modelo `Notification` ni las rutas. Implementar (modelo + rutas + trigger al crear cotización) o remover el bell del admin layout — decisión pendiente.
2. **Migraciones Prisma versionadas** — hoy se usa `prisma db push` sin `prisma/migrations`; considerar pasar a `prisma migrate` para tener historial de cambios de schema en producción.

Cumplido: página `/cuenta`, formulario de cotización (`/cotizar`), registro de usuarios (`/registro`), galería de imágenes vía Supabase Storage.
