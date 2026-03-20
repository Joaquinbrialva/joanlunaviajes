import Link from 'next/link';

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' };

const EXPLORE = [
  { label: 'Destinos', href: '/destinos' },
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Guías de viaje', href: '#' },
];

const AGENCY = [
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
  { label: 'Blog', href: '#' },
];

export default function Footer() {
  return (
    <footer className="w-screen -mx-[calc((100vw-100%)/2)] bg-[#080f16] text-slate-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-10">

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr_1.6fr] gap-10 md:gap-8 pb-12 border-b border-white/[0.07]">

          {/* Marca */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-baseline gap-0.5 select-none">
              <span
                className="text-[15px] font-extrabold tracking-tight uppercase text-white leading-none"
                style={syne}
              >
                JOANLUNA
              </span>
              <span
                className="text-accent leading-none ml-0.5"
                style={{ ...cormorant, fontSize: '18px', textShadow: '0 0 16px rgba(255,126,45,0.35)' }}
              >
                viajes
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">
              Experiencias de viaje memorables con itinerarios curados y atención 100% personalizada.
            </p>
          </div>

          {/* Explorar */}
          <div className="space-y-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600"
              style={syne}
            >
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
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600"
              style={syne}
            >
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

          {/* Newsletter */}
          <div className="space-y-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600"
              style={syne}
            >
              Novedades
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Recibe ofertas y destinos curados directo en tu mail.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 min-w-0 h-9 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-accent/40 transition-colors"
                style={syne}
              />
              <button
                type="button"
                className="shrink-0 h-9 px-4 rounded-lg bg-accent/90 text-white text-xs font-semibold hover:bg-accent transition-colors"
                style={syne}
              >
                Ir
              </button>
            </form>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-8 text-xs text-slate-700">
          <p style={syne}>© 2026 Joanluna Viajes. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5" style={syne}>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Soporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
