'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { LuMapPin } from 'react-icons/lu';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
      {items.map((dest) => (
        <DestinationCard key={dest.id} destination={dest} />
      ))}
    </div>
  );
}

function DestinationCard({ destination: dest }) {
  return (
    <Link href={`/destinos/${dest.slug}`} className="group block w-full max-w-sm">
      <article className="bg-surface w-full rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl">
        <div className="relative">
          <Image
            src={dest.featuredImage}
            alt={dest.name}
            width={400}
            height={250}
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-sm font-semibold">
            <LuMapPin className="h-4 w-4 shrink-0" />
            {dest.name}, {dest.country}
          </div>
          {dest.isPopular && (
            <span className="absolute top-3 left-3 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full">
              Popular
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col grow">
          <p className="text-sm text-muted line-clamp-2">{dest.shortDescription}</p>
          <p className="mt-3 text-xs text-accent font-semibold uppercase tracking-wide group-hover:underline">
            Explorar destino →
          </p>
        </div>
      </article>
    </Link>
  );
}
