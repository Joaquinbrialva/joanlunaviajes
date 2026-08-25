'use client';

import { SearchField, Input } from '@heroui/react';
import { LuSearch } from 'react-icons/lu';

/**
 * Search + filter row that sits above every admin table. One shape for
 * search-plus-select across ofertas/destinos/cotizaciones/usuarios.
 */
export default function TableToolbar({ search, onSearchChange, placeholder = 'Buscar…', children }) {
  return (
    <div className='flex flex-col gap-3 border-b border-default px-5 py-4 md:flex-row md:items-center'>
      <SearchField value={search} onChange={onSearchChange} className='flex-1' aria-label={placeholder}>
        <SearchField.Group>
          <SearchField.SearchIcon>
            <LuSearch className='h-4 w-4' />
          </SearchField.SearchIcon>
          <SearchField.Input placeholder={placeholder} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      {children && <div className='flex items-center gap-2 shrink-0'>{children}</div>}
    </div>
  );
}
