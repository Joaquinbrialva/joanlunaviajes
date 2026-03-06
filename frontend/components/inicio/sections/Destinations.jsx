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
      <div>
        <CollageGrid destinations={destinations} />
      </div>
    </div>
  );
}
