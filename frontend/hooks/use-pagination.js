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
