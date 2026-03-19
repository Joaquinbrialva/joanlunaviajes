'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { LuMapPin, LuExternalLink, LuX, LuLoader } from 'react-icons/lu';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Hotel address search using OpenStreetMap Nominatim.
 * 100% free, no API key required.
 *
 * Props:
 *  - value: string — current address (controlled from parent)
 *  - mapsUrl: string — saved Maps URL
 *  - onChange: ({ address, placeId, mapsUrl }) => void
 */
export default function HotelAddressSearch({ value = '', mapsUrl = '', onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const wrapperRef                  = useRef(null);

  // Sync external value (e.g., when offer loads in edit page)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOut(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  // Nominatim search (debounced)
  const search = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 3) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'es', 'User-Agent': 'JoanLunaViajes/1.0' },
        });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450),
    []
  );

  function handleInputChange(e) {
    const val = e.target.value;
    setInputValue(val);
    if (!val) {
      onChange({ address: '', placeId: '', mapsUrl: '' });
      setResults([]);
      setOpen(false);
      return;
    }
    search(val);
  }

  function handleSelect(place) {
    const addr = place.display_name;
    const lat  = place.lat;
    const lon  = place.lon;
    const url  = `https://www.google.com/maps?q=${lat},${lon}`;
    setInputValue(addr);
    setOpen(false);
    setResults([]);
    onChange({ address: addr, placeId: String(place.place_id), mapsUrl: url });
  }

  function handleClear() {
    setInputValue('');
    setResults([]);
    setOpen(false);
    onChange({ address: '', placeId: '', mapsUrl: '' });
  }

  function handleBlur() {
    // Small delay so click on result registers first
    setTimeout(() => {
      if (inputValue && inputValue !== value) {
        // User typed something but didn't select — store raw text with search URL
        onChange({
          address: inputValue,
          placeId: '',
          mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(inputValue)}`,
        });
      }
      setOpen(false);
    }, 180);
  }

  // Shorten displayed address (remove long tail after country)
  function shortLabel(display_name) {
    const parts = display_name.split(', ');
    return parts.slice(0, 5).join(', ');
  }

  return (
    <div className='relative' ref={wrapperRef}>
      <div className='relative'>
        <LuMapPin size={13} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10' />
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          placeholder='Buscar dirección o nombre del hotel...'
          autoComplete='off'
          className='h-11 pl-9 pr-8 rounded-xl border border-default w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all hover:border-muted/50'
        />
        <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center'>
          {loading && <LuLoader size={13} className='animate-spin text-muted' />}
          {!loading && inputValue && (
            <button type='button' onClick={handleClear} className='text-muted/50 hover:text-muted transition-colors'>
              <LuX size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <ul className='absolute z-50 mt-1.5 w-full rounded-xl border border-default bg-surface shadow-xl overflow-hidden'>
          {results.map((place) => (
            <li key={place.place_id}>
              <button
                type='button'
                onMouseDown={() => handleSelect(place)}
                className='w-full text-left px-3.5 py-2.5 text-sm hover:bg-surface-secondary transition-colors flex items-start gap-2.5'
              >
                <LuMapPin size={13} className='text-accent shrink-0 mt-0.5' />
                <span className='break-words leading-snug'>{shortLabel(place.display_name)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Maps link when address is saved */}
      {value && mapsUrl && (
        <a
          href={mapsUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 text-[11px] text-accent hover:underline mt-1.5'
        >
          <LuExternalLink size={10} /> Ver en Google Maps
        </a>
      )}
    </div>
  );
}
