# Admin Table Pagination — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Problem

The three admin tables (ofertas, destinos, cotizaciones) load all data at once and render every row without any pagination. As data grows this degrades performance and usability.

---

## Scope

Add client-side pagination to:
- `/admin/ofertas` — custom HTML `<table>`
- `/admin/destinos` — custom HTML `<table>`
- `/admin/cotizaciones` — HeroUI `Table` component

---

## Approach: Client-side pagination

All data is already fetched into component state. Pagination slices the filtered array in memory — no backend changes required.

---

## Implementation Plan

### 1. `usePagination` hook (`frontend/hooks/use-pagination.js`)

```js
// Accepts: items (array), pageSize (number, default 10)
// Returns: { page, setPage, pageItems, totalPages, from, to }
// - pageItems: sliced subset for current page
// - from/to: 1-based indices for summary text
// - resets to page 1 when items reference changes (via useEffect)
```

### 2. Pagination UI component (`frontend/components/ui/table-pagination.jsx`)

Thin wrapper around HeroUI `Pagination` compound component.

```jsx
// Props: { page, totalPages, from, to, total, onChange }
// Renders:
//   <Pagination.Summary>  "Mostrando {from}–{to} de {total}"
//   <Pagination.Content>  Previous · page numbers with ellipsis · Next
// Page numbers logic:
//   - Always show first and last page
//   - Show current ± 1
//   - Ellipsis where there are gaps > 1
// Hidden when totalPages <= 1
```

### 3. Wire into each table page

For each of the 3 pages:
- Import `usePagination` and `TablePagination`
- Apply hook to the filtered `rows` array
- Render `pageItems` in the table body instead of `rows`
- Reset page when search/filter changes (pass `rows` to the hook — the hook's `useEffect` handles reset automatically since `rows` identity changes on filter)
- Render `<TablePagination>` below the table

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Page size | 10 | Standard for admin tables |
| Pagination strategy | Client-side | Data already in memory, no backend needed |
| Reuse | Shared hook + shared UI component | 3 tables with same pattern |
| Reset on filter | Automatic via `useEffect` on `rows` | Avoids showing empty page after narrowing results |
| HeroUI component | `Pagination` compound (v3) | Per project conventions |

---

## Files to Create

- `frontend/hooks/use-pagination.js`
- `frontend/components/ui/table-pagination.jsx`

## Files to Modify

- `frontend/app/admin/ofertas/page.jsx`
- `frontend/app/admin/destinos/page.jsx`
- `frontend/app/admin/cotizaciones/page.jsx`
