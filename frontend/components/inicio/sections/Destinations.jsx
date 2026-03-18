'use client';
import { useEffect, useState } from 'react';
import CollageGrid from '../ui/CollageGrid';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/destinos')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDestinations(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-accent" />
            <p className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent" style={syne}>
              Inspiración
            </p>
          </div>
          <h2
            className="font-light text-foreground leading-none"
            style={{ ...cormorant, fontSize: 'clamp(2.4rem, 5vw, 3.5rem)' }}
          >
            Destinos <em className="font-semibold">Trending</em>
          </h2>
          <p className="text-[13px] text-muted mt-3 max-w-xs leading-relaxed" style={syne}>
            Los rincones del mundo que más eligen nuestros viajeros.
          </p>
        </div>
        <Link
          href="/destinos"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-accent transition-colors group shrink-0"
          style={syne}
        >
          Ver todos
          <LuArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <DestinationsSkeleton />
      ) : destinations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center rounded-2xl border border-dashed border-border">
          <p className="font-semibold text-foreground" style={syne}>Próximamente nuevos destinos</p>
          <p className="text-sm text-muted">Estamos sumando los mejores destinos del mundo. Vuelve pronto.</p>
        </div>
      ) : (
        <CollageGrid destinations={destinations} />
      )}

      {/* Ver todos — mobile */}
      <div className="sm:hidden text-center">
        <Link
          href="/destinos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
          style={syne}
        >
          Ver todos los destinos <LuArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function DestinationsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[140px] animate-pulse">
      <div className="rounded-3xl border border-border bg-surface-secondary md:col-span-7 md:row-span-2" />
      <div className="rounded-3xl border border-border bg-surface-secondary md:col-span-5" />
      <div className="rounded-3xl border border-border bg-surface-secondary md:col-span-3" />
      <div className="rounded-3xl border border-border bg-surface-secondary md:col-span-4" />
      <div className="rounded-3xl border border-border bg-surface-secondary md:col-span-5" />
    </div>
  );
}
