import Link from 'next/link';

const EXPLORE = [
  { label: 'Ofertas', href: '/ofertas' },
];

const AGENCY = [
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

export default function Footer() {
  return (
    <footer className="w-screen -mx-[calc((100vw-100%)/2)] bg-surface-night text-slate-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-10">

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr] gap-10 md:gap-8 pb-12 border-b border-white/[0.07]">

          {/* Marca */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-baseline gap-1 select-none">
              <span className="text-[15px] font-extrabold tracking-tight uppercase text-white leading-none">
                JOANLUNA
              </span>
              <span className="text-brand-primary leading-none text-[14px] font-medium lowercase">
                viajes
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">
              Experiencias de viaje memorables con itinerarios curados y atención 100% personalizada.
            </p>
          </div>

          {/* Explorar */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Explorar
            </p>
            <nav className="space-y-2.5">
              {EXPLORE.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-slate-500 hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Agencia */}
          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Agencia
            </p>
            <nav className="space-y-2.5">
              {AGENCY.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-slate-500 hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="pt-8 text-xs text-slate-700">
          <p>© 2026 Joanluna Viajes. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
