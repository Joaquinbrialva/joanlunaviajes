'use client';

import { getLogoUrl } from '@/lib/airlines';

export default function AirlineLogo({ iata, name, size = 100, className = 'h-6 w-10 object-contain shrink-0' }) {
  if (!iata) return null;
  return (
    <img
      src={getLogoUrl(iata, size)}
      alt={name || iata}
      className={className}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}
