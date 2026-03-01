'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import destinations from '@/mocks/mock_destinations_informative.json';

export default function AdminDestinationsPage() {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('all');

  const continents = useMemo(() => ['all', ...new Set(destinations.map((item) => item.continent))], []);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return destinations.filter((destination) => {
      const searchMatch =
        query.length === 0 ||
        destination.name.toLowerCase().includes(query) ||
        destination.country.toLowerCase().includes(query);

      const continentMatch = continent === 'all' || destination.continent === continent;
      return searchMatch && continentMatch;
    });
  }, [continent, search]);

  return (
    <div className='space-y-5'>
      <section>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-4xl font-bold'>Gestion de destinos</h2>
            <p className='text-muted'>Controla contenido, metadata SEO y visibilidad comercial.</p>
          </div>
          <Link
            href='/admin/destinos/nuevo'
            className='inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white'
          >
            Nuevo destino
          </Link>
        </div>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3'>
          <input
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary'
            placeholder='Buscar por nombre o pais...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className='h-10 px-3 rounded-lg border border-default bg-surface-secondary'
            value={continent}
            onChange={(event) => setContinent(event.target.value)}
          >
            {continents.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Todos los continentes' : item}
              </option>
            ))}
          </select>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-surface-secondary text-muted'>
              <tr>
                <th className='text-left px-3 py-3 font-semibold'>Destino</th>
                <th className='text-left px-3 py-3 font-semibold'>Pais</th>
                <th className='text-left px-3 py-3 font-semibold'>Continente</th>
                <th className='text-left px-3 py-3 font-semibold'>Presupuesto diario</th>
                <th className='text-left px-3 py-3 font-semibold'>Popular</th>
                <th className='text-right px-3 py-3 font-semibold'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((destination) => (
                <tr key={destination.id} className='border-t border-default'>
                  <td className='px-3 py-3'>
                    <p className='font-semibold'>{destination.name}</p>
                    <p className='text-xs text-muted'>ID {destination.id}</p>
                  </td>
                  <td className='px-3 py-3'>{destination.country}</td>
                  <td className='px-3 py-3'>{destination.continent}</td>
                  <td className='px-3 py-3'>USD {destination.stats.averageDailyBudgetUSD}</td>
                  <td className='px-3 py-3'>{destination.isPopular ? 'Si' : 'No'}</td>
                  <td className='px-3 py-3'>
                    <div className='flex justify-end gap-2'>
                      <Link href={`/destinos/${destination.slug}`} className='text-xs font-semibold px-2 py-1 rounded border border-default hover:bg-surface-secondary'>
                        Ver
                      </Link>
                      <button className='text-xs font-semibold px-2 py-1 rounded border border-default hover:bg-surface-secondary'>
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
