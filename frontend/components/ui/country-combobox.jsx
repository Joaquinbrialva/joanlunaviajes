'use client';

import { useEffect, useRef, useState } from 'react';
import countries from '@/lib/countries';

export default function CountryCombobox({ value, onChange, placeholder = 'Seleccionar país...' }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = query.trim() === ''
    ? countries
    : countries.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  function select(country) {
    setQuery(country);
    setOpen(false);
    onChange(country);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    setOpen(true);
    onChange(e.target.value);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value !== query) setQuery(value || '');
  }, [value]);

  return (
    <div ref={containerRef} className='relative w-full'>
      <input
        type='text'
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className='h-10 px-3 rounded-lg border border-default w-full text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
      />

      {open && filtered.length > 0 && (
        <ul className='absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-default bg-surface shadow-lg'>
          {filtered.map((country) => (
            <li key={country}>
              <button
                type='button'
                onMouseDown={() => select(country)}
                className='w-full px-3 py-2 text-sm hover:bg-surface-secondary text-left'
              >
                {country}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && query.trim() && (
        <div className='absolute z-50 mt-1 w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-muted shadow-lg'>
          País no encontrado — se usará el texto ingresado.
        </div>
      )}
    </div>
  );
}
