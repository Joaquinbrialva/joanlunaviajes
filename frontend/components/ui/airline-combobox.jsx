'use client';

import { useEffect, useRef, useState } from 'react';
import airlines, { getLogoUrl } from '@/lib/airlines';

export default function AirlineCombobox({ value, iata, onChange }) {
  // value = nombre de la aerolínea, iata = código IATA
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const containerRef = useRef(null);

  const filtered = query.trim() === ''
    ? airlines
    : airlines.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.iata.toLowerCase().includes(query.toLowerCase())
      );

  function select(airline) {
    setQuery(airline.name);
    setOpen(false);
    onChange({ name: airline.name, iata: airline.iata });
  }

  function handleInput(e) {
    setQuery(e.target.value);
    setOpen(true);
    if (e.target.value === '') {
      onChange({ name: '', iata: '' });
    }
  }

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // Si el texto no coincide con ninguna aerolínea conocida, lo guardamos igual
        if (!airlines.find((a) => a.name === query)) {
          onChange({ name: query, iata: '' });
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, onChange]);

  // Sincronizar si el valor externo cambia
  useEffect(() => {
    if (value !== query) setQuery(value || '');
  }, [value]);

  return (
    <div ref={containerRef} className='relative w-full'>
      <div className='relative'>
        {iata && !imgErrors[iata] && (
          <img
            src={getLogoUrl(iata)}
            alt={value}
            className='absolute left-2 top-1/2 -translate-y-1/2 h-5 w-8 object-contain'
            onError={() => setImgErrors((prev) => ({ ...prev, [iata]: true }))}
          />
        )}
        <input
          type='text'
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder='Buscar aerolínea...'
          className={`h-10 rounded-lg border border-default w-full pr-3 ${iata && !imgErrors[iata] ? 'pl-12' : 'pl-3'}`}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className='absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-default bg-surface shadow-lg'>
          {filtered.map((airline) => (
            <li key={airline.iata}>
              <button
                type='button'
                onMouseDown={() => select(airline)}
                className='w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-secondary text-left'
              >
                {!imgErrors[airline.iata] ? (
                  <img
                    src={getLogoUrl(airline.iata)}
                    alt={airline.name}
                    className='h-5 w-8 object-contain flex-shrink-0'
                    onError={() => setImgErrors((prev) => ({ ...prev, [airline.iata]: true }))}
                  />
                ) : (
                  <span className='h-5 w-8 flex-shrink-0 text-xs text-muted font-mono leading-5'>{airline.iata}</span>
                )}
                <span className='flex-1 truncate'>{airline.name}</span>
                <span className='text-xs text-muted font-mono'>{airline.iata}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && (
        <div className='absolute z-50 mt-1 w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-muted shadow-lg'>
          No se encontraron aerolíneas. Se guardará el texto ingresado.
        </div>
      )}
    </div>
  );
}
