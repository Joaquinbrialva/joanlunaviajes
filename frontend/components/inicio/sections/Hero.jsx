'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import Image from 'next/image';
import { LuSearch } from 'react-icons/lu';
import DatePickerField from '@/components/ui/date-picker-field';

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (date) params.set('date', date);
    router.push(`/ofertas${params.size ? `?${params}` : ''}`);
  }

  return (
    <section>
      <div className="relative h-[70vh] rounded-4xl overflow-hidden">

        {/* Imagen optimizada */}
        <Image
          src="/assets/images/hero-img.jpg"
          alt="Paisaje de viaje"
          fill
          priority
          className="object-cover"
        />

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenido */}
        <div className="relative z-10 h-full flex flex-col justify-center px-12 text-white space-y-8">

          <p className="uppercase tracking-widest text-sm text-white/80 border-white p-1.5 w-fit rounded-xl backdrop-blur-3xl">
            Experiencia Premium
          </p>

          <h2 className="text-5xl md:text-6xl font-bold max-w-3xl leading-tight">
            Descubre el mundo con{' '}
            <span className="italic text-accent">
              Joanluna Viajes
            </span>
          </h2>

          <p className="max-w-125 text-white/90">
            Diseñamos viajes inolvidables a tu medida. Desde playas paradisíacas
            hasta las cumbres más altas, tu próxima aventura comienza aquí.
          </p>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl w-fit">
            <div className="relative">
              <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
              <input
                type="text"
                placeholder="¿A dónde quieres ir?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-xl bg-white/15 border border-white/20 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-1 focus:ring-white/40 w-64"
              />
            </div>
            <DatePickerField
              value={date}
              onChange={setDate}
              placeholder="¿Cuándo viajas?"
              triggerClassName="h-10 px-3 rounded-xl bg-white/15 border border-white/20 text-white text-sm w-44 flex items-center gap-2 hover:bg-white/20 transition-colors"
            />
            <Button type="submit" color="primary" className="h-10 px-6 font-semibold">
              Buscar
            </Button>
          </form>

        </div>
      </div>
    </section>
  );
}
