'use client';

import { Button, Input } from '@heroui/react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section>
      <div className="relative h-[70vh] rounded-4xl overflow-hidden shadow-2xl">

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
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl w-fit">
            <input placeholder="¿A dónde quieres ir?" className="backdrop-blur-md rounded-xl p-2" />
            <input placeholder="Fechas" type="date" className="backdrop-blur-md rounded-xl p-2" />
            <Button color="primary">
              Buscar
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
