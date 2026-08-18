'use client';
import { useEffect, useState } from 'react';
import CollageGrid from '../ui/CollageGrid';
import Link from 'next/link';
import { LuArrowRight, LuCompass } from 'react-icons/lu';

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

  return (
    <div className="space-y-8">
      {/* Header — distinto del de Ofertas: rol de descubrimiento, color secundario de marca */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-secondary/12 flex items-center justify-center shrink-0">
            <LuCompass size={22} className="text-brand-secondary" />
          </div>
          <div>
            <h2 className="font-extrabold text-foreground leading-tight tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
              Destinos que enamoran
            </h2>
            <p className="text-[13px] text-muted mt-2 max-w-xs leading-relaxed">
              Los rincones del mundo que más eligen nuestros viajeros.
            </p>
          </div>
        </div>
        <Link
          href="/destinos"
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted hover:text-brand-secondary transition-colors group shrink-0"
        >
          Ver todos
          <LuArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <DestinationsSkeleton />
      ) : destinations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center rounded-2xl border border-dashed border-border">
          <p className="font-semibold text-foreground">Próximamente nuevos destinos</p>
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
        <div key={i} className="rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="bg-surface-secondary" style={{ aspectRatio: '3 / 2' }} />
        </div>
      ))}
    </div>
  );
}
