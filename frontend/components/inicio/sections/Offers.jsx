'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/inicio/ui/Card';
import { Button } from '@heroui/react';
import { FaChevronRight } from 'react-icons/fa';

export default function Offers() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch('/api/ofertas')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setOffers(data.slice(0, 6)); })
      .catch(() => {});
  }, []);

  return (
    <div className='space-y-4'>
      <div className='flex items-end justify-between'>
        <div>
          <h2 className='text-3xl font-bold'>Ofertas Imperdibles</h2>
          <p className='text-muted'>Paquetes exclusivos seleccionados para vos.</p>
        </div>
        <Link href='/ofertas'>
          <Button variant='secondary'>
            Ver todas las ofertas
            <FaChevronRight />
          </Button>
        </Link>
      </div>
      {offers.length === 0 ? (
        <div className='flex flex-col items-center gap-3 py-16 text-center rounded-2xl border border-dashed border-default'>
          <p className='font-semibold text-foreground'>Próximamente nuevas ofertas</p>
          <p className='text-sm text-muted'>Estamos preparando paquetes exclusivos para vos. Volvé pronto.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center'>
          {offers.map((offer) => (
            <Card key={offer.id} {...offer} />
          ))}
        </div>
      )}
    </div>
  );
}
