'use client';
import { useEffect, useState } from 'react';
import CollageGrid from '../ui/CollageGrid';

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    fetch('/api/destinos')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDestinations(data); })
      .catch(() => {});
  }, []);

  return (
    <div className='flex-col space-y-6'>
      <div className='flex-col text-center'>
        <p className='text-lg text-accent font-medium'>INSPIRACIÓN</p>
        <p className='text-4xl font-medium'>Destinos Trending</p>
      </div>
      {destinations.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-default'>
          <p className='font-semibold text-foreground'>Próximamente nuevos destinos</p>
          <p className='text-sm text-muted'>Estamos sumando los mejores destinos del mundo. Volvé pronto.</p>
        </div>
      ) : (
        <CollageGrid destinations={destinations} />
      )}
    </div>
  );
}
