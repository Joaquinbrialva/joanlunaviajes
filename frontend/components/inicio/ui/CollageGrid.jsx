'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { LuArrowUpRight, LuMapPin } from 'react-icons/lu';


export default function CollageGrid({ destinations = [] }) {
  const items = useMemo(() => {
    const sorted = [...destinations].sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
    return sorted.slice(0, 4);
  }, [destinations]);

  if (!items.length) return null;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
      {items.map((dest) => (
        <DestinationCard key={dest.id} destination={dest} />
      ))}
    </div>
  );
}

function DestinationCard({ destination: dest }) {
  return (
    <Link href={`/destinos/${dest.slug}`} className='group block'>
      <article
        className='relative overflow-hidden rounded-2xl transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/25'
        style={{ aspectRatio: '3 / 2' }}
      >
        {/* Image */}
        {dest.featuredImage ? (
          <Image
            src={dest.featuredImage}
            alt={dest.name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-cover transition-transform duration-700 group-hover:scale-[1.07]'
          />
        ) : (
          <div className='absolute inset-0 bg-slate-900' />
        )}

        {/* Base gradient */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5' />

        {/* Hover accent overlay */}
        <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'
          style={{ background: 'linear-gradient(to top, rgba(255,126,45,0.18) 0%, transparent 50%)' }}
        />

        {/* Popular badge */}
        {dest.isPopular && (
          <span className='absolute top-3.5 left-3.5 bg-accent text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.15em] shadow-md'>
            Popular
          </span>
        )}

        {/* Arrow — appears on hover */}
        <div className='absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300'>
          <LuArrowUpRight size={14} className='text-white' />
        </div>

        {/* Bottom content */}
        <div className='absolute inset-x-0 bottom-0 p-4'>
          {/* Country eyebrow */}
          <div className='flex items-center gap-1.5 mb-1.5'>
            <LuMapPin size={9} className='text-white/40 shrink-0' />
            <span className='text-white/40 text-[9px] uppercase tracking-[0.22em] font-bold'>
              {dest.country}
            </span>
          </div>

          {/* Destination name — Cormorant medium weight */}
          <h3
            className='text-white font-bold text-lg leading-tight group-hover:text-orange-100 transition-colors duration-300'
          >
            {dest.name}
          </h3>

          {/* Description — slides up on hover */}
          {dest.shortDescription && (
            <p className='text-white/50 text-[11px] leading-relaxed line-clamp-2 max-h-0 overflow-hidden opacity-0 group-hover:max-h-[3rem] group-hover:opacity-100 group-hover:mt-2 transition-all duration-400'>
              {dest.shortDescription}
            </p>
          )}

          {/* CTA */}
          <div className='flex items-center gap-1.5 mt-2 opacity-60 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300'>
            <span className='text-accent text-[10px] font-bold uppercase tracking-[0.18em]'>
              Explorar
            </span>
            <LuArrowUpRight size={10} className='text-accent' />
          </div>
        </div>
      </article>
    </Link>
  );
}
