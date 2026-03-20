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
