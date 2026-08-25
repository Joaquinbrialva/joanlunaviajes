# Novedades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Alejandra (or any admin/agent/designer) upload photo albums with an optional caption from the admin panel, and show them as a "Novedades" story-style section on the homepage, right below the Hero.

**Architecture:** New Prisma model `Update` (public label "Novedades") persisted via the existing Postgres/Prisma stack. A new Express router (`backend/src/routes/novedades.js`) follows the exact CRUD shape of `destinos.js`. The admin UI reuses the existing `GalleryEditor` component (multi-image upload/reorder/remove against `/api/upload`) plus the `components/admin/kit` primitives (`Panel`, `Section`, `PageHeader`, `ConfirmDialog`, `StatusChip`). The public UI is a new homepage section component with a story-circle row and a fullscreen lightbox, modeled on the existing `GalleryCollage` lightbox pattern.

**Tech Stack:** Next.js (frontend), Express + Prisma + Postgres/Supabase (backend), `@heroui/react` v3, Tailwind v4, Supabase Storage for images.

**Spec:** `docs/superpowers/specs/2026-08-17-novedades-design.md`

## Global Constraints

- No auto-sync with WhatsApp/Instagram/Facebook in this phase — manual upload only (per spec).
- No automated test suite is wired into this project (`backend/test-flows.js` exists but isn't run by any npm script, per `CLAUDE.md`). Every task below verifies with manual `curl` calls against the running dev backend and/or manual checks in the browser against the running dev frontend — this replaces the write-test/run-test steps a project with test infra would use.
- Roles allowed to manage novedades: `admin`, `agent`, `designer` (matches spec — this is a *superset* of the `admin`/`agent` pattern used by `ofertas.js`/`destinos.js`, matching the `ALLOWED_ROLES` pattern already used by `upload.js`/`settings.js`).
- `Update.images` is a plain `String[]` of Supabase Storage public URLs, in gallery order — matches `Destination.gallery`.
- `GET /api/novedades` (no auth) returns **all** novedades ordered `createdAt desc`, exactly like `GET /api/ofertas` and `GET /api/destinos` do today (no per-route status filtering — that would be a new pattern this codebase doesn't otherwise use). The admin page consumes this endpoint directly, same as `admin/ofertas` and `admin/destinos` already do. The **public homepage component is what filters to `status === 'published'`** client-side before rendering — this is where the spec's "public only sees published" requirement is actually enforced.
- Keep role lists in sync per `CLAUDE.md`: this feature does not introduce a new role, so `users.js` `VALID_ROLES` and `frontend/app/admin/usuarios/page.jsx` `ROLES` need no changes.

---

### Task 1: Prisma model + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma model `Update` with fields `id: String`, `images: String[]`, `caption: String`, `status: String`, `createdAt: DateTime`, `updatedAt: DateTime` — consumed by Task 2's route file as `prisma.update`.

- [ ] **Step 1: Add the model**

Add this block to `backend/prisma/schema.prisma`, after the `Subscriber` model:

```prisma
model Update {
  id        String   @id @default(uuid())
  images    String[]
  caption   String   @default("")
  status    String   @default("published")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Push the schema and regenerate the client**

Run from `backend/`:
```bash
npm run db:push
npm run db:generate
```
Expected: both commands exit 0. `db:push` reports the new `Update` table created (or "already in sync" is NOT expected here — first run should show the diff applying).

- [ ] **Step 3: Verify the client exposes the new model**

Run from `backend/`:
```bash
node -e "import('./src/store/prisma.js').then(({prisma}) => prisma.update.findMany().then(r => console.log('OK', r.length)))"
```
Expected: prints `OK 0` (table exists, empty).

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add Update prisma model for novedades"
```

---

### Task 2: Backend CRUD routes for novedades

**Files:**
- Create: `backend/src/routes/novedades.js`
- Modify: `backend/src/server.js`

**Interfaces:**
- Consumes: `prisma.update` (Task 1), `requireRole` from `backend/src/middleware/auth.js` (existing, signature `requireRole(...roles)` returns `[requireAuth, checkerMiddleware]`, spread with `...requireRole(...)` into route args).
- Produces: routes `GET /api/novedades`, `POST /api/novedades`, `PATCH /api/novedades/:id`, `DELETE /api/novedades/:id`. Response shape for a novedad: `{ id, images: string[], caption: string, status: 'draft'|'published', createdAt, updatedAt }`.

- [ ] **Step 1: Write the route file**

Create `backend/src/routes/novedades.js`:

```javascript
import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { requireRole } from '../middleware/auth.js';

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

const router = Router();

// GET /api/novedades — público, todas las novedades (el filtrado a "publicado" lo hace el frontend público)
router.get('/', async (_req, res) => {
  try {
    const updates = await prisma.update.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(updates);
  } catch (err) {
    console.error('[GET /api/novedades]', err);
    res.status(500).json({ error: 'No se pudieron obtener las novedades.' });
  }
});

// POST /api/novedades  (admin, agent, designer)
router.post('/', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    const images = normalizeList(req.body.images);
    if (images.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos una imagen.' });
    }

    const data = {
      images,
      caption: String(req.body.caption || '').trim(),
      status: req.body.status === 'draft' ? 'draft' : 'published',
    };

    const created = await prisma.update.create({ data });
    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo guardar la novedad.' });
  }
});

// PATCH /api/novedades/:id  (admin, agent, designer)
router.patch('/:id', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    const existing = await prisma.update.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Novedad no encontrada.' });

    const images = req.body.images !== undefined ? normalizeList(req.body.images) : existing.images;
    if (images.length === 0) {
      return res.status(400).json({ error: 'Agregá al menos una imagen.' });
    }

    const updateData = {
      images,
      caption: req.body.caption !== undefined ? String(req.body.caption).trim() : existing.caption,
      status: req.body.status !== undefined
        ? (req.body.status === 'draft' ? 'draft' : 'published')
        : existing.status,
    };

    const updated = await prisma.update.update({ where: { id: req.params.id }, data: updateData });
    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo actualizar la novedad.' });
  }
});

// DELETE /api/novedades/:id  (admin, agent, designer)
router.delete('/:id', ...requireRole('admin', 'agent', 'designer'), async (req, res) => {
  try {
    await prisma.update.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Novedad no encontrada.' });
    console.error('[DELETE /api/novedades]', err);
    res.status(500).json({ error: 'No se pudo eliminar la novedad.' });
  }
});

export default router;
```

- [ ] **Step 2: Mount the router**

In `backend/src/server.js`, add the import next to the other route imports (after line 10, `import destinosRouter from './routes/destinos.js';`):

```javascript
import novedadesRouter from './routes/novedades.js';
```

And add the mount next to the other `app.use('/api/...')` calls (after line 59, `app.use('/api/destinos', destinosRouter);`):

```javascript
app.use('/api/novedades', novedadesRouter);
```

- [ ] **Step 3: Start the backend and verify manually**

Run from `backend/`: `npm run dev` (leave running).

In another terminal, verify the public GET works and is empty:
```bash
curl http://localhost:4000/api/novedades
```
Expected: `[]`

Verify POST is rejected without auth:
```bash
curl -i -X POST http://localhost:4000/api/novedades -H "Content-Type: application/json" -d "{\"images\":[\"https://example.com/a.jpg\"]}"
```
Expected: `401` (no `auth_token` cookie).

Log in as an existing admin/agent/designer user via `POST /api/auth/login` to capture the `auth_token` cookie (use `-c cookies.txt`), then:
```bash
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"<existing-admin-email>\",\"password\":\"<password>\"}"
curl -i -b cookies.txt -X POST http://localhost:4000/api/novedades -H "Content-Type: application/json" -d "{\"images\":[\"https://example.com/a.jpg\",\"https://example.com/b.jpg\"],\"caption\":\"Test\"}"
```
Expected: `201` with the created novedad JSON (`images` array of length 2, `status: "published"`).

```bash
curl http://localhost:4000/api/novedades
```
Expected: array with the one novedad just created.

Delete it to leave the table clean:
```bash
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/novedades/<id-from-response>
```
Expected: `204`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/novedades.js backend/src/server.js
git commit -m "feat: add novedades CRUD routes"
```

---

### Task 3: Admin status chip for novedades

**Files:**
- Modify: `frontend/components/admin/kit/status-chip.jsx`
- Modify: `frontend/components/admin/kit/index.js`

**Interfaces:**
- Produces: exported `NOVEDAD_STATUS` map and `NovedadStatusChip({ status })` component, same shape as the existing `OFFER_STATUS`/`OfferStatusChip` pair — consumed by Task 5's admin page.

- [ ] **Step 1: Add the status map and chip component**

In `frontend/components/admin/kit/status-chip.jsx`, add after the existing `ROLE_STATUS` block (after line 36):

```javascript
export const NOVEDAD_STATUS = {
  published: { color: 'success', label: 'Publicada' },
  draft:     { color: 'default', label: 'Borrador' },
};
```

And add after the existing `RoleStatusChip` function (after line 51):

```javascript
export function NovedadStatusChip({ status }) {
  const s = NOVEDAD_STATUS[status] || NOVEDAD_STATUS.published;
  return <StatusChip color={s.color}>{s.label}</StatusChip>;
}
```

- [ ] **Step 2: Export it from the kit index**

In `frontend/components/admin/kit/index.js`, change line 1 from:
```javascript
export { default as StatusChip, OfferStatusChip, InquiryStatusChip, RoleStatusChip, OFFER_STATUS, INQUIRY_STATUS, ROLE_STATUS } from './status-chip';
```
to:
```javascript
export { default as StatusChip, OfferStatusChip, InquiryStatusChip, RoleStatusChip, NovedadStatusChip, OFFER_STATUS, INQUIRY_STATUS, ROLE_STATUS, NOVEDAD_STATUS } from './status-chip';
```

- [ ] **Step 3: Verify it compiles**

Run from `frontend/`: `npm run lint`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/admin/kit/status-chip.jsx frontend/components/admin/kit/index.js
git commit -m "feat: add NovedadStatusChip to admin kit"
```

---

### Task 4: Admin nav entry

**Files:**
- Modify: `frontend/components/admin/shell/nav-config.js`

**Interfaces:**
- Produces: a `/admin/novedades` nav link visible to `admin`, `agent`, `designer` (no `showForRoles`/`hideForRoles` restriction needed since all three manage it and `client` never reaches `/admin/*`, matching how `Ofertas`/`Destinos` links are already unrestricted).

- [ ] **Step 1: Add the icon import and nav link**

In `frontend/components/admin/shell/nav-config.js`, change the import block (lines 1-8) to add `LuSparkles`:
```javascript
import {
  LuLayoutDashboard,
  LuClipboardList,
  LuGlobe,
  LuMessageSquare,
  LuImage,
  LuUsers,
  LuSparkles,
} from 'react-icons/lu';
```

Add the link to the `'Contenido'` group (after line 22, the `Cotizaciones` entry):
```javascript
      { href: '/admin/novedades', label: 'Novedades', icon: LuSparkles },
```

- [ ] **Step 2: Verify visually**

With `npm run dev` running in `frontend/`, log into `/admin` and confirm "Novedades" appears in the sidebar under "Contenido" for an admin user. Clicking it will 404 until Task 5 lands — that's expected at this point.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/admin/shell/nav-config.js
git commit -m "feat: add novedades nav entry"
```

---

### Task 5: Admin novedades page

**Files:**
- Create: `frontend/app/admin/novedades/page.jsx`

**Interfaces:**
- Consumes: `GET/POST/PATCH/DELETE /api/novedades` (Task 2), `GalleryEditor` (`frontend/components/ui/gallery-editor.jsx`, props `images: string[], onChange: (arr) => void, disabled?: boolean`), kit components `PageHeader, Section, Panel, ConfirmDialog, TextareaField, NovedadStatusChip` (Tasks 3 + existing), `toastError/toastSuccess` from `@/lib/toast`.
- Produces: the `/admin/novedades` route referenced by Task 4's nav link.

- [ ] **Step 1: Write the page**

Create `frontend/app/admin/novedades/page.jsx`:

```jsx
'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Spinner, toast } from '@heroui/react';
import { LuPlus, LuPencil, LuTrash2, LuSparkles } from 'react-icons/lu';
import GalleryEditor from '@/components/ui/gallery-editor';
import { toastError, toastSuccess } from '@/lib/toast';
import { PageHeader, Section, Panel, ConfirmDialog, TextareaField, EmptyState, NovedadStatusChip } from '@/components/admin/kit';

const EMPTY_FORM = { images: [], caption: '', status: 'published' };

export default function NovedadesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    fetch('/api/novedades')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUpdates(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ images: item.images || [], caption: item.caption || '', status: item.status || 'published' });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.images.length === 0) {
      toastError('Agregá al menos una imagen.');
      return;
    }
    setSaving(true);
    try {
      const body = { images: form.images, caption: form.caption, status: form.status };
      if (editing) {
        const res = await fetch(`/api/novedades/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
        setUpdates((prev) => prev.map((u) => (u.id === editing.id ? data : u)));
        toastSuccess('Novedad actualizada');
      } else {
        const res = await fetch('/api/novedades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear.');
        setUpdates((prev) => [data, ...prev]);
        toastSuccess('Novedad creada');
      }
      closeDrawer();
    } catch (err) {
      toastError(err, editing ? 'Error al actualizar' : 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/novedades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar la novedad.');
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    };
    toast.promise(deleteFn, { loading: 'Eliminando...', success: 'Novedad eliminada', error: (err) => err?.message || 'Error al eliminar' });
    setPendingDelete(null);
  }

  return (
    <div className='space-y-5'>
      <ConfirmDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title='¿Eliminar novedad?' onConfirm={executeDelete}>
        Esta acción no se puede deshacer. La novedad dejará de mostrarse en el sitio.
      </ConfirmDialog>

      <Panel isOpen={drawerOpen} onClose={closeDrawer} title={editing ? 'Editar novedad' : 'Nueva novedad'} size='lg'>
        <form onSubmit={handleSubmit} className='space-y-4 p-5'>
          <div>
            <label className='mb-1.5 block text-[13px] font-medium text-foreground'>
              Imágenes <span className='text-accent'>*</span>
            </label>
            <GalleryEditor images={form.images} onChange={(arr) => update('images', arr)} />
          </div>

          <TextareaField
            label='Descripción'
            hint='Opcional'
            rows={3}
            value={form.caption}
            onChange={(e) => update('caption', e.target.value)}
            placeholder='Un texto corto para acompañar las fotos...'
          />

          <Checkbox isSelected={form.status === 'published'} onChange={(checked) => update('status', checked ? 'published' : 'draft')}>
            <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
            <Checkbox.Content>Publicada (visible en el sitio)</Checkbox.Content>
          </Checkbox>

          <div className='flex gap-3 pt-2'>
            <Button type='button' variant='tertiary' className='flex-1' onClick={closeDrawer}>Cancelar</Button>
            <Button type='submit' className='flex-1' isDisabled={saving}>
              {saving ? <Spinner color='current' size='sm' /> : null}
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear novedad'}
            </Button>
          </div>
        </form>
      </Panel>

      <PageHeader
        title='Novedades'
        description='Álbumes tipo Estados/Stories para mostrar en la home.'
        actions={
          <Button onClick={openCreate}>
            <LuPlus className='h-4 w-4' />
            Nueva novedad
          </Button>
        }
      />

      <Section>
        <div className='p-4 md:p-5'>
          {loading ? (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className='aspect-square animate-pulse rounded-xl bg-surface-secondary' />)}
            </div>
          ) : updates.length === 0 ? (
            <EmptyState
              icon={LuSparkles}
              title='Todavía no hay novedades'
              description='Creá la primera para que aparezca en la home.'
              action={<Button onClick={openCreate}>Nueva novedad</Button>}
            />
          ) : (
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {updates.map((item) => (
                <div key={item.id} className='group relative aspect-square overflow-hidden rounded-xl border border-default bg-surface-secondary'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.images?.[0] && <img src={item.images[0]} alt={item.caption || 'Novedad'} className='h-full w-full object-cover' />}
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0' />
                  <div className='absolute left-2 top-2'><NovedadStatusChip status={item.status} /></div>
                  <div className='absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2'>
                    <div className='min-w-0'>
                      {item.caption && <p className='truncate text-xs font-medium text-white'>{item.caption}</p>}
                      <p className='text-[10px] text-white/70'>{item.images?.length || 0} foto{item.images?.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className='flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                      <button onClick={() => openEdit(item)} className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70' title='Editar'>
                        <LuPencil size={13} />
                      </button>
                      <button onClick={() => setPendingDelete(item.id)} className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-danger/80' title='Eliminar'>
                        <LuTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually in the browser**

With both `backend` (`npm run dev`) and `frontend` (`npm run dev`) running, log into `/admin` as an admin/agent/designer user and go to `/admin/novedades`:
1. Confirm the empty state shows.
2. Click "Nueva novedad", upload 2+ images via `GalleryEditor`, type a caption, leave "Publicada" checked, submit.
3. Confirm the card grid shows the new novedad with correct photo count and the "Publicada" chip.
4. Click edit, uncheck "Publicada", save — confirm the chip changes to "Borrador".
5. Click delete, confirm the confirm dialog, confirm the card disappears.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/novedades/page.jsx
git commit -m "feat: add admin novedades page"
```

---

### Task 6: Public "Novedades" homepage section

**Files:**
- Create: `frontend/components/inicio/sections/Novedades.jsx`
- Modify: `frontend/app/page.js`

**Interfaces:**
- Consumes: `GET /api/novedades` (Task 2) — filters client-side to `status === 'published'` per the Global Constraints decision.
- Produces: default export `Novedades()` React component rendering `null` when there are zero published novedades; inserted into the homepage right after `<Hero />`.

- [ ] **Step 1: Write the section component**

Create `frontend/components/inicio/sections/Novedades.jsx`:

```jsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

function StoryLightbox({ novedad, onClose }) {
  const images = novedad.images;
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col bg-black/97'
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className='flex items-center justify-between px-5 py-3 shrink-0'>
        <span className='text-white/50 text-sm'>
          {index + 1} <span className='text-white/25'>/</span> {images.length}
        </span>
        <button type='button' onClick={onClose} className='text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10' aria-label='Cerrar'>
          <LuX size={20} />
        </button>
      </div>

      <div className='flex-1 relative flex items-center justify-center min-h-0 px-14'>
        {images.length > 1 && (
          <button type='button' onClick={prev} className='absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10' aria-label='Anterior'>
            <LuChevronLeft size={28} />
          </button>
        )}

        <div className='relative w-full h-full'>
          <Image src={images[index]} alt={novedad.caption || 'Novedad'} fill className='object-contain' sizes='100vw' />
        </div>

        {images.length > 1 && (
          <button type='button' onClick={next} className='absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10' aria-label='Siguiente'>
            <LuChevronRight size={28} />
          </button>
        )}
      </div>

      {novedad.caption && (
        <p className='shrink-0 px-6 pb-4 text-center text-sm text-white/80'>{novedad.caption}</p>
      )}
    </div>
  );
}

export default function Novedades() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch('/api/novedades')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUpdates(data.filter((u) => u.status === 'published' && u.images?.length > 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || updates.length === 0) return null;

  return (
    <div className='space-y-5'>
      <h2 className='font-extrabold text-foreground leading-tight tracking-tight' style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
        Novedades
      </h2>

      <div className='flex gap-4 overflow-x-auto pb-2'>
        {updates.map((novedad) => (
          <button
            key={novedad.id}
            type='button'
            onClick={() => setActive(novedad)}
            className='flex shrink-0 flex-col items-center gap-2'
          >
            <span className='relative block h-20 w-20 overflow-hidden rounded-full ring-2 ring-accent ring-offset-2 ring-offset-background transition-transform hover:scale-105 sm:h-24 sm:w-24'>
              <Image src={novedad.images[0]} alt={novedad.caption || 'Novedad'} fill className='object-cover' sizes='96px' />
            </span>
            {novedad.caption && (
              <span className='max-w-[80px] truncate text-xs text-muted'>{novedad.caption}</span>
            )}
          </button>
        ))}
      </div>

      {active && <StoryLightbox novedad={active} onClose={() => setActive(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Insert into the homepage**

In `frontend/app/page.js`, add the import (after line 2, `import Hero from '@/components/inicio/sections/Hero';`):
```javascript
import Novedades from '@/components/inicio/sections/Novedades';
```

And render it right after `<Hero />` (replace lines 9-16 with):
```jsx
		<>
			<Hero />
			<div className="pt-20 sm:pt-28 space-y-24">
				<Novedades />
				<Offers />
				<HowItWorks />
				<QuoteCTA />
			</div>
		</>
```

- [ ] **Step 3: Verify manually in the browser**

With `frontend`/`backend` dev servers running and at least one **published** novedad with 2+ images created in Task 5's verification:
1. Load `/` — confirm the "Novedades" row appears below the Hero with a circular thumbnail.
2. Click the circle — confirm the fullscreen lightbox opens on the first image.
3. Use the arrow buttons and left/right keyboard keys to navigate between images; confirm wraparound at both ends.
4. Press Escape / click the backdrop / click the X — confirm it closes.
5. In the admin, edit that novedad to "Borrador" (draft) and reload `/` — confirm the row disappears (or shows other published items only).
6. With zero published novedades, confirm the section renders nothing (no empty heading, no layout gap) — inspect the DOM to confirm `Novedades()` returned `null`.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/inicio/sections/Novedades.jsx frontend/app/page.js
git commit -m "feat: add public novedades homepage section"
```
