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

NOTE: `frontend/hooks/` does not exist yet — create the directory.

```js
// Accepts: items (array), pageSize (number, default 10)
// Returns: { page, setPage, pageItems, totalPages, from, to }
// - pageItems: sliced subset for current page
// - from/to: 1-based indices for summary text
// - resets to page 1 when items reference changes (via useEffect on items)
//
// IMPORTANT: Caller must pass a stable (useMemo-derived) array reference.
// The reset fires on reference equality change, not deep equality.
// All three callers already use useMemo for their `rows` array — pass that directly.
```

### 2. Pagination UI component (`frontend/components/ui/admin-table-pagination.jsx`)

Named `admin-table-pagination.jsx` (NOT `pagination.jsx`) to avoid confusion with the
existing shadcn-style `components/ui/pagination.jsx` which is unused but present.

Imports `Pagination` from `@heroui/react` — do NOT import from `./pagination`.

```jsx
// Props: { page, totalPages, from, to, total, onChange }
// Renders:
//   <Pagination>
//     <Pagination.Summary>  "Mostrando {from}–{to} de {total}"
//     <Pagination.Content>               ← <ul> wrapper — MUST be included
//       <Pagination.Item>
//         <Pagination.Previous onPress={...}>  ← previous button
//       <Pagination.Item>
//         <Pagination.Link isActive onPress={...}>  ← each page number
//       <Pagination.Item>
//         <Pagination.Ellipsis />   ← gap marker
//       <Pagination.Item>
//         <Pagination.Next onPress={...}>  ← next button
//     </Pagination.Content>
//
// IMPORTANT: Use `onPress` (React Aria) on Pagination.Link, Pagination.Previous,
// and Pagination.Next — NOT `onClick`. These extend ButtonPrimitive from react-aria-components.
//
// NOTE: Pagination.Content DOES exist in @heroui/react v3 and MUST be used as the
// <ul> wrapper around all Pagination.Item children (omitting it produces invalid HTML).
// Do NOT import Pagination from ./pagination (that is the unused shadcn artifact).
//
// Page numbers logic:
//   - Always show first and last page
//   - Show current ± 1
//   - Pagination.Ellipsis where there are gaps > 1
//
// Hidden (returns null) when totalPages <= 1
```

### 3. Wire into each table page

For each of the 3 pages:
- Import `usePagination` from `@/hooks/use-pagination`
- Import `AdminTablePagination` from `@/components/ui/admin-table-pagination`
- Apply hook to the filtered `rows` useMemo result (stable reference — hook reset works correctly)
- Render `pageItems` in the table body instead of `rows`
- Render `<AdminTablePagination>` below the table

**Bulk selection behavior (ofertas and destinos pages):**
Select-all checkbox selects only the **current page** items (`pageItems`), not all filtered rows.
This avoids selecting invisible items the user hasn't seen.

For **ofertas**: update the named `allRowsSelected` constant (line 103) to use `pageItems`.
Update the select-all `onChange` to `new Set(pageItems.map(o => o.id))`.

For **destinos**: the equivalent logic is inlined directly inside JSX — there is no named variable.
Update the `<SquareCheckbox checked={...}>` prop to use `pageItems` instead of `rows`, AND
update the `onChange` handler `new Set(rows.map((d) => d.id))` to use `pageItems` instead of `rows`.

**cotizaciones existing footer:**
Remove the existing `{rows.length} resultado(s)` line at the bottom of the cotizaciones table —
`AdminTablePagination`'s Summary ("Mostrando X–Y de Z") replaces it and is less redundant.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Page size | 10 | Standard for admin tables |
| Pagination strategy | Client-side | Data already in memory, no backend needed |
| Reuse | Shared hook + shared UI component | 3 tables with same pattern |
| Reset on filter | Automatic via `useEffect` on `rows` reference | Avoids showing empty page after narrowing results |
| HeroUI component | `Pagination` compound (v3) from `@heroui/react` | Per project conventions |
| Select-all scope | Current page only | Avoids selecting invisible rows |
| New component name | `admin-table-pagination.jsx` | Avoids collision with existing `pagination.jsx` |
| `onPress` vs `onClick` | Always `onPress` | React Aria ButtonPrimitive requires it |

---

## Files to Create

- `frontend/hooks/` (new directory)
- `frontend/hooks/use-pagination.js`
- `frontend/components/ui/admin-table-pagination.jsx`

## Files to Modify

- `frontend/app/admin/ofertas/page.jsx`
- `frontend/app/admin/destinos/page.jsx`
- `frontend/app/admin/cotizaciones/page.jsx`
