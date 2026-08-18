'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { LuArrowUpRight, LuMapPin, LuSparkles } from 'react-icons/lu';


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
  const highlightCount = dest.highlights?.length || 0;

  return (
    <Link href={`/destinos/${dest.slug}`} className='group block'>
      <article className='relative overflow-hidden rounded-3xl aspect-[3/4] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50'>
        {/* Image */}
        {dest.featuredImage ? (
          <Image
            src={dest.featuredImage}
            alt={dest.name}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            className='object-cover'
          />
        ) : (
          <div className='absolute inset-0 bg-slate-900' />
        )}

        {/* Base gradient */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5' />

        {/* Popular badge */}
        {dest.isPopular && (
          <span className='absolute top-3.5 left-3.5 bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md'>
            Popular
          </span>
        )}

        {/* Arrow */}
        <div className='absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center'>
          <LuArrowUpRight size={14} className='text-white' />
        </div>

        {/* Bottom content */}
        <div className='absolute inset-x-0 bottom-0 p-4'>
          {/* Country eyebrow */}
          <div className='flex items-center gap-1.5 mb-1.5'>
            <LuMapPin size={10} className='text-white/40 shrink-0' />
            <span className='text-white/40 text-xs uppercase tracking-widest font-bold'>
              {dest.country}
            </span>
          </div>

          {/* Destination name */}
          <h3 className='text-white font-bold text-xl leading-tight'>
            {dest.name}
          </h3>

          {highlightCount > 0 && (
            <div className='flex items-center gap-1.5 mt-1.5 text-white/70'>
              <LuSparkles size={12} className='shrink-0' />
              <span className='text-xs font-medium'>
                {highlightCount} {highlightCount === 1 ? 'lugar imperdible' : 'lugares imperdibles'}
              </span>
            </div>
          )}

          {dest.shortDescription && (
            <p className='text-white/50 text-xs leading-relaxed line-clamp-2 mt-2'>
              {dest.shortDescription}
            </p>
          )}

          {/* CTA */}
          <div className='flex items-center gap-1.5 mt-2.5'>
            <span className='text-accent text-xs font-bold uppercase tracking-widest'>
              Explorar
            </span>
            <LuArrowUpRight size={12} className='text-accent' />
          </div>
        </div>
      </article>
    </Link>
  );
}
