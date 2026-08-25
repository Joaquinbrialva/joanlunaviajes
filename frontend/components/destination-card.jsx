'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LuArrowUpRight, LuGlobe, LuMapPin } from 'react-icons/lu';

function normalizeStyles(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.join(',').split(',').map((s) => s.trim()).filter(Boolean);
}

export default function DestinationCard({ destination: dest }) {
  const styles = normalizeStyles(dest.travelStyles).slice(0, 2);
  const budget = dest.stats?.averageDailyBudgetUSD;

  return (
    <Link
      href={`/destinos/${dest.slug}`}
      className="group block h-full"
    >
      <article className="h-full flex flex-col overflow-hidden rounded-[20px] border border-border bg-surface transition-shadow duration-300 ease-out hover:shadow-xl hover:shadow-black/8 hover:border-brand-secondary/25">

        {/* Imagen */}
        <div className="relative h-52 shrink-0 overflow-hidden">
          {dest.featuredImage ? (
            <Image
              src={dest.featuredImage}
              alt={dest.city}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-surface-tertiary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {(dest.isPopular || dest.isFeatured) && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full">
              {dest.isPopular ? 'Popular' : 'Destacado'}
            </span>
          )}

          <div className="absolute inset-x-3.5 bottom-3.5">
            <div className="flex items-center gap-1.5 text-white/70 text-[10px] uppercase tracking-wide font-bold mb-1">
              <LuMapPin size={10} className="shrink-0" />
              <span className="truncate">{dest.country}</span>
              <span className="text-white/40">·</span>
              <LuGlobe size={10} className="shrink-0" />
              <span>{dest.continent}</span>
            </div>
            <h3 className="text-white font-extrabold text-lg leading-tight line-clamp-1">{dest.city}</h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex grow flex-col px-[18px] pt-3.5 pb-[18px]">
          {styles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {styles.map((s) => (
                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-tertiary text-muted">{s}</span>
              ))}
            </div>
          )}

          {dest.shortDescription && (
            <p className="text-[12px] text-muted line-clamp-2 mb-auto pb-3.5 leading-relaxed">{dest.shortDescription}</p>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-border">
            {budget != null ? (
              <div>
                <span className="text-[17px] font-extrabold text-foreground leading-none">USD {budget}</span>
                <span className="text-[11px] text-muted ml-1">/día</span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-brand-secondary">A consultar</p>
            )}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-brand-secondary-foreground shadow-brand-secondary/30 transition-shadow duration-300 group-hover:shadow-lg">
              <LuArrowUpRight size={15} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-45" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
