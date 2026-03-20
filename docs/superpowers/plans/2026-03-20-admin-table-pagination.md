# Admin Table Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side pagination (10 rows/page) to the three admin tables: ofertas, destinos, and cotizaciones.

**Architecture:** A shared `usePagination` hook slices the filtered `rows` array in memory. A shared `AdminTablePagination` UI component wraps HeroUI v3's `Pagination` compound component. Each of the three admin pages imports both and wires them in. No backend changes required.

**Tech Stack:** Next.js (App Router), React hooks, `@heroui/react` v3 Pagination compound component, Tailwind CSS v4.

> ⚠️ **No automated tests exist in this project** (see CLAUDE.md). Verification steps use manual browser testing at `http://localhost:3000`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `frontend/hooks/use-pagination.js` | Create | Pagination state: slicing, page reset, totals |
| `frontend/components/ui/admin-table-pagination.jsx` | Create | HeroUI Pagination UI wrapper |
| `frontend/app/admin/ofertas/page.jsx` | Modify | Wire hook + UI, fix select-all |
| `frontend/app/admin/destinos/page.jsx` | Modify | Wire hook + UI, fix select-all |
| `frontend/app/admin/cotizaciones/page.jsx` | Modify | Wire hook + UI, remove old footer |

---

## Task 1: `usePagination` hook

**Files:**
- Create: `frontend/hooks/use-pagination.js` (directory does not exist — create it first)

- [ ] **Step 1: Create the hooks directory and file (run from repo root)**

```bash
mkdir frontend/hooks
```

- [ ] **Step 2: Write `use-pagination.js`**

```js
// frontend/hooks/use-pagination.js
// No 'use client' needed — hooks are imported by client components and inherit that context.
import { useEffect, useState } from 'react';

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever items reference changes (filter/search changed).
  // IMPORTANT: callers must pass a useMemo-derived array so reference only changes
  // when filters change — not on every render. All three current callers do this.
  useEffect(() => {
    setPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  // from/to are 1-based indices for the summary text.
  // When items is empty: from=0, to=0 — but the component hides itself when totalPages<=1,
  // so "Mostrando 0–0 de 0" is never rendered.
  const from = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, items.length);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, setPage, pageItems, totalPages, from, to };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/use-pagination.js
git commit -m "feat: agregar hook usePagination"
```

---

## Task 2: `AdminTablePagination` UI component

**Files:**
- Create: `frontend/components/ui/admin-table-pagination.jsx`

> ⚠️ Import `Pagination` from `@heroui/react` — do NOT import from `./pagination` (unused shadcn artifact in the same folder).
> Use `onPress` on all Pagination sub-components — NOT `onClick`. These extend React Aria `ButtonPrimitive`.
> `Pagination.Content` MUST wrap all `Pagination.Item` children (it renders as `<ul>`; omitting it produces invalid HTML).
> `Pagination.Summary` and `Pagination.Content` are siblings inside `<Pagination>`. The component's own root handles their layout — no outer `justify-between` wrapper needed.

- [ ] **Step 1: Write `admin-table-pagination.jsx`**

```jsx
// frontend/components/ui/admin-table-pagination.jsx
'use client';

import { Pagination } from '@heroui/react';

function getPageNumbers(page, totalPages) {
  const candidates = [1, page - 1, page, page + 1, totalPages];
  const valid = [...new Set(candidates.filter((p) => p >= 1 && p <= totalPages))].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < valid.length; i++) {
    if (i > 0 && valid[i] - valid[i - 1] > 1) result.push(null); // null → ellipsis
    result.push(valid[i]);
  }
  return result;
}

export default function AdminTablePagination({ page, totalPages, from, to, total, onChange }) {
  if (totalPages <= 1) return null;

  const pageNums = getPageNumbers(page, totalPages);

  return (
    <div className='pt-3 px-1'>
      <Pagination>
        <Pagination.Summary className='text-xs text-muted'>
          Mostrando {from}–{to} de {total}
        </Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={page <= 1}
              onPress={() => onChange(page - 1)}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>

          {pageNums.map((p, i) =>
            p === null ? (
              <Pagination.Item key={`ellipsis-${i}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={p}>
                <Pagination.Link isActive={p === page} onPress={() => onChange(p)}>
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            )
          )}

          <Pagination.Item>
            <Pagination.Next
              isDisabled={page >= totalPages}
              onPress={() => onChange(page + 1)}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/ui/admin-table-pagination.jsx
git commit -m "feat: agregar componente AdminTablePagination"
```

---

## Task 3: Wire pagination into `/admin/ofertas`

**Files:**
- Modify: `frontend/app/admin/ofertas/page.jsx`

**Overview of changes:**
1. Add two imports.
2. Call `usePagination(rows)` after the `rows` useMemo.
3. Fix `allRowsSelected` constant — change `rows` to `pageItems`.
4. Fix select-all checkbox `onChange` — change `rows` to `pageItems`.
5. Replace `rows.map(...)` in tbody with `pageItems.map(...)`.
   > ⚠️ Do NOT change the `rows.length === 0` empty-state check above it — that correctly reflects whether the entire filtered set is empty, independent of which page is visible.
6. Add `<AdminTablePagination>` below the scroll container.

> ⚠️ These steps add/change lines sequentially. Line numbers below are approximate and may shift by ±2 after prior edits — use the code snippets to locate the correct positions.

- [ ] **Step 1: Add imports after existing imports**

```js
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
```

- [ ] **Step 2: Call the hook after the `rows` useMemo**

Locate:
```js
}, [offers, search, status]);
```
Add on the next line:
```js
const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);
```

- [ ] **Step 3: Fix `allRowsSelected`**

Find:
```js
const allRowsSelected = rows.length > 0 && rows.every((offer) => selected.has(offer.id));
```
Replace with:
```js
const allRowsSelected = pageItems.length > 0 && pageItems.every((offer) => selected.has(offer.id));
```

- [ ] **Step 4: Fix select-all checkbox onChange in `<thead>`**

Find:
```js
onChange={(v) => setSelected(v ? new Set(rows.map((o) => o.id)) : new Set())}
```
Replace with:
```js
onChange={(v) => setSelected(v ? new Set(pageItems.map((o) => o.id)) : new Set())}
```

- [ ] **Step 5: Replace `rows.map(...)` in `<tbody>`**

Find in the tbody (note: do NOT touch the `rows.length === 0` check above — leave it as is):
```js
) : rows.map((offer) => {
```
Replace with:
```js
) : pageItems.map((offer) => {
```

- [ ] **Step 6: Add `<AdminTablePagination>` below the scroll container**

Find the closing `</div>` of `<div className='overflow-x-auto rounded-xl border border-default'>` and add after it:
```jsx
<AdminTablePagination
  page={page}
  totalPages={totalPages}
  from={from}
  to={to}
  total={rows.length}
  onChange={setPage}
/>
```

- [ ] **Step 7: Verify manually**

Open `http://localhost:3000/admin/ofertas`.
- ≤10 offers: no pagination shown (component returns null).
- >10 offers: pagination appears below table with page numbers and "Mostrando X–Y de Z".
- Changing page shows different rows.
- Typing in search or changing status filter resets to page 1.
- Select-all checkbox selects only the current page rows.

- [ ] **Step 8: Commit**

```bash
git add frontend/app/admin/ofertas/page.jsx
git commit -m "feat: paginar tabla de ofertas en admin"
```

---

## Task 4: Wire pagination into `/admin/destinos`

**Files:**
- Modify: `frontend/app/admin/destinos/page.jsx`

**Overview of changes:**
1. Add two imports.
2. Call `usePagination(rows)` after the `rows` useMemo.
3. Fix select-all checkbox — both `checked` and `onChange` are inlined in JSX (no named variable), both reference `rows` → change to `pageItems`.
4. Replace `rows.map(...)` in tbody with `pageItems.map(...)`.
   > ⚠️ Do NOT change the `rows.length === 0` empty-state check above it.
5. Add `<AdminTablePagination>` below the scroll container.

- [ ] **Step 1: Add imports**

```js
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
```

- [ ] **Step 2: Call hook after `rows` useMemo**

Locate:
```js
}, [destinations, continent, search]);
```
Add on the next line:
```js
const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);
```

- [ ] **Step 3: Fix select-all `<SquareCheckbox>` in `<thead>`**

Find the exact block (both `checked` and `onChange` reference `rows`):
```jsx
<SquareCheckbox
  checked={rows.length > 0 && rows.every((d) => selected.has(d.id))}
  onChange={(v) => setSelected(v ? new Set(rows.map((d) => d.id)) : new Set())}
/>
```
Replace with:
```jsx
<SquareCheckbox
  checked={pageItems.length > 0 && pageItems.every((d) => selected.has(d.id))}
  onChange={(v) => setSelected(v ? new Set(pageItems.map((d) => d.id)) : new Set())}
/>
```

- [ ] **Step 4: Replace `rows.map(...)` in `<tbody>`**

Find (leave the `rows.length === 0` check above it untouched):
```js
) : rows.map((destination) => {
```
Replace with:
```js
) : pageItems.map((destination) => {
```

- [ ] **Step 5: Add `<AdminTablePagination>` below the scroll container**

After the closing `</div>` of `<div className='overflow-x-auto rounded-xl border border-default'>`, add:
```jsx
<AdminTablePagination
  page={page}
  totalPages={totalPages}
  from={from}
  to={to}
  total={rows.length}
  onChange={setPage}
/>
```

- [ ] **Step 6: Verify manually**

Open `http://localhost:3000/admin/destinos`.
- Pagination appears only when >10 filtered results.
- Continent or search filter change resets to page 1.
- Select-all selects only current page rows.

- [ ] **Step 7: Commit**

```bash
git add frontend/app/admin/destinos/page.jsx
git commit -m "feat: paginar tabla de destinos en admin"
```

---

## Task 5: Wire pagination into `/admin/cotizaciones`

**Files:**
- Modify: `frontend/app/admin/cotizaciones/page.jsx`

**Overview of changes:**
1. Add two imports.
2. Call `usePagination(rows)` after the `rows` useMemo.
3. Replace `items={rows}` on `<Table.Body>` with `items={pageItems}`.
4. Remove the existing results footer block.
5. Add `<AdminTablePagination>` after the skeleton/table ternary, inside the `<section>`.

- [ ] **Step 1: Add imports**

```js
import { usePagination } from '@/hooks/use-pagination';
import AdminTablePagination from '@/components/ui/admin-table-pagination';
```

- [ ] **Step 2: Call hook after `rows` useMemo**

Locate:
```js
}, [inquiries, statusFilter, search]);
```
Add on the next line:
```js
const { page, setPage, pageItems, totalPages, from, to } = usePagination(rows);
```

- [ ] **Step 3: Replace `items={rows}` on `<Table.Body>`**

Find:
```jsx
<Table.Body
  items={rows}
```
Replace with:
```jsx
<Table.Body
  items={pageItems}
```

- [ ] **Step 4: Remove the existing results footer**

Find and delete this entire block:
```jsx
{!loading && rows.length > 0 && (
  <div className='px-5 py-3 border-t border-default'>
    <p className='text-xs text-muted'>{rows.length} resultado{rows.length !== 1 ? 's' : ''}</p>
  </div>
)}
```

- [ ] **Step 5: Add `<AdminTablePagination>` after the ternary**

The section structure looks like this:
```jsx
<section className='rounded-2xl border border-default bg-surface overflow-hidden'>
  {/* filter bar */}
  <div className='px-5 py-4 ...'>...</div>

  {loading ? (
    <InquiryTableSkeleton />
  ) : (
    <Table>...</Table>
  )}

  {/* ← INSERT HERE — after the closing )} of the ternary, before </section> */}
</section>
```

Add after the closing `)}` of the `loading ? ... : ...` ternary (before `</section>`):
```jsx
<AdminTablePagination
  page={page}
  totalPages={totalPages}
  from={from}
  to={to}
  total={rows.length}
  onChange={setPage}
/>
```

- [ ] **Step 6: Verify manually**

Open `http://localhost:3000/admin/cotizaciones`.
- Old "X resultados" footer is gone.
- Pagination shows "Mostrando X–Y de Z" when >10 inquiries.
- Filtering by status or search resets to page 1.

- [ ] **Step 7: Commit**

```bash
git add frontend/app/admin/cotizaciones/page.jsx
git commit -m "feat: paginar tabla de cotizaciones en admin"
```
