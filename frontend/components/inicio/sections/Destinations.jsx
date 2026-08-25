'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import DestinationCard from '@/components/destination-card';
import Reveal from '@/components/ui/reveal';

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/destinos')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDestinations(data.filter((d) => d.status === 'published')); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const count = destinations.length;
  const visible = destinations.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div className="flex items-end gap-5">
          <span
            className="font-extrabold leading-none tracking-tight text-brand-secondary/20 select-none shrink-0"
            style={{ fontSize: 'clamp(3.2rem, 7vw, 5.5rem)' }}
            aria-hidden="true"
          >
            {String(count || 12).padStart(2, '0')}
          </span>
          <div className="pb-1">
            <h2 className="font-extrabold leading-[1.05] tracking-tight text-foreground" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>
              Destinos que <span className="text-brand-secondary">enamoran</span>
            </h2>
            <p className="text-[13px] text-muted mt-2 max-w-xs leading-relaxed">
              Los rincones del mundo que más eligen nuestros viajeros.
            </p>
          </div>
        </div>
        <Link
          href="/destinos"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-brand-secondary transition-colors group shrink-0 whitespace-nowrap"
        >
          Ver todos los destinos
          <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-brand-secondary group-hover:bg-brand-secondary/10 transition-colors">
            <LuArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      {loading ? (
        <DestinationsSkeleton />
      ) : destinations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center rounded-[28px] border border-dashed border-border">
          <p className="font-semibold text-foreground">Próximamente nuevos destinos</p>
          <p className="text-sm text-muted">Estamos sumando los mejores destinos del mundo. Vuelve pronto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {visible.map((dest, i) => (
            <Reveal key={dest.id} delay={i * 80}>
              <DestinationCard destination={dest} />
            </Reveal>
          ))}
        </div>
      )}

      <div className="sm:hidden text-center">
        <Link
          href="/destinos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary"
        >
          Ver todos los destinos <LuArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function DestinationsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-border bg-surface overflow-hidden">
          <div className="h-52 bg-surface-secondary" />
          <div className="p-[18px] space-y-3">
            <div className="h-3.5 w-3/4 rounded-full bg-surface-secondary" />
            <div className="h-3.5 w-1/2 rounded-full bg-surface-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
