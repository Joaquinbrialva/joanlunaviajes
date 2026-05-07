import Link from 'next/link';
import { MdPriceCheck, MdSupportAgent } from 'react-icons/md';
import { PiShieldCheckFill } from 'react-icons/pi';
import { LuArrowRight, LuHeart, LuMapPin, LuUsers } from 'react-icons/lu';
const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

const VALORES = [
  {
    Icon: LuHeart,
    title: 'Pasión por viajar',
    description: 'Cada destino que ofrecemos lo conocemos de primera mano. Viajamos, exploramos y seleccionamos solo las experiencias que nos emocionan.',
  },
  {
    Icon: PiShieldCheckFill,
    title: 'Confianza y respaldo',
    description: 'Más de 10 años acompañando a viajeros. Trabajamos con operadores certificados y garantizamos cada reserva que realizamos.',
  },
  {
    Icon: MdSupportAgent,
    title: 'Atención personalizada',
    description: 'No somos un bot ni un formulario. Hablas con personas reales que entienden tus necesidades y arman el viaje ideal para ti.',
  },
  {
    Icon: MdPriceCheck,
    title: 'Precios honestos',
    description: 'Sin letras chicas ni costos ocultos. Te mostramos exactamente qué incluye cada propuesta antes de que decidas.',
  },
  {
    Icon: LuMapPin,
    title: 'Destinos curados',
    description: 'No trabajamos con cualquier destino. Cada lugar fue elegido por su calidad, seguridad y potencial de experiencia.',
  },
  {
    Icon: LuUsers,
    title: 'Para todo tipo de viajero',
    description: 'Familias, parejas, grupos o solos. Adaptamos cada propuesta al estilo y ritmo de quien viaja.',
  },
];

const EQUIPO = [
  {
    nombre: 'Joan Luna',
    rol: 'Fundadora & Directora',
    descripcion: 'Viajera empedernida con más de 40 países visitados. Fundó la agencia en 2013 con la convicción de que viajar bien es un derecho de todos.',
    iniciales: 'JL',
  },
  {
    nombre: 'Martina Ríos',
    rol: 'Especialista en Europa',
    descripcion: 'Vivió 3 años en España y recorrió el continente de punta a punta. La persona indicada para un itinerario europeo perfecto.',
    iniciales: 'MR',
  },
  {
    nombre: 'Lucas Pereyra',
    rol: 'Especialista en América',
    descripcion: 'Apasionado por la naturaleza y el ecoturismo. Conoce cada rincón de Sudamérica y descubre destinos que no encuentras en Google.',
    iniciales: 'LP',
  },
];

const STATS = [
  { value: '+10', label: 'años de experiencia' },
  { value: '+800', label: 'viajeros felices' },
  { value: '40+', label: 'destinos activos' },
  { value: '100%', label: 'personalización' },
];

export default function NosotrosPage() {
  return (
    <div>

      {/* ── Hero editorial ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0b1520]" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-transparent to-transparent" />
        {/* Número decorativo de fondo */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[240px] leading-none font-light text-white/[0.025] select-none pointer-events-none pr-8 hidden lg:block"
          style={cormorant}
        >
          10+
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.28em] font-semibold text-orange-300/60 mb-4"
              style={syne}
            >
              Sobre nosotros
            </p>
            <h1
              className="text-5xl md:text-6xl font-light text-white leading-[1.05] mb-6"
              style={cormorant}
            >
              Viajes que se{' '}
              <em className="font-semibold" style={{ color: '#ff9a5c' }}>
                sienten,
              </em>
              <br />
              no solo se ven.
            </h1>
            <p className="text-[15px] text-white/50 leading-relaxed max-w-lg" style={syne}>
              Somos Joan Luna Viajes, una agencia boutique con una sola obsesión: que cada viaje que organizamos sea memorable. No vendemos paquetes — creamos experiencias a medida.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-5"
              >
                <p
                  className="text-4xl font-light text-white mb-1"
                  style={cormorant}
                >
                  {value}
                </p>
                <p className="text-xs text-white/40" style={syne}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Historia ── */}
      <section className="max-w-5xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent" />
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent" style={syne}>
              Nuestra historia
            </p>
          </div>
          <h2
            className="text-3xl md:text-4xl font-light text-foreground mb-6 leading-tight"
            style={cormorant}
          >
            Empezamos con una{' '}
            <em className="font-semibold">mochila</em> y muchas ganas
          </h2>
          <div className="space-y-4 text-[14px] text-muted leading-relaxed" style={syne}>
            <p>
              Joan Luna Viajes nació en 2013 cuando Joan, después de años viajando por el mundo, decidió que quería ayudar a otros a descubrir lo que ella ya sabía: que un viaje bien planificado puede cambiar la vida.
            </p>
            <p>
              Lo que empezó como una pequeña operación desde casa se convirtió en una agencia de referencia en Argentina, con cientos de clientes que repiten año tras año.
            </p>
            <p>
              Hoy somos un equipo de apasionados por los viajes que trabaja todos los días para que tu próxima aventura sea exactamente como la soñaste — o mejor.
            </p>
          </div>
        </div>

        {/* Decoración numérica */}
        <div className="flex flex-col gap-0 divide-y divide-border">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-4 py-5">
              <span
                className="text-5xl font-light text-accent/80 w-28 shrink-0"
                style={cormorant}
              >
                {value}
              </span>
              <span className="text-sm text-muted" style={syne}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Valores ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] py-20 bg-surface-secondary dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent mb-3" style={syne}>
              Lo que nos mueve
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-foreground" style={cormorant}>
              Nuestros <em className="font-semibold">valores</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {VALORES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="bg-surface dark:bg-slate-800/60 rounded-2xl p-6 border border-border/50 hover:border-accent/30 transition-colors duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Icon className="text-accent w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-[14px]" style={syne}>{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Equipo ── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-accent mb-3" style={syne}>
            Las personas detrás
          </p>
          <h2 className="text-3xl md:text-4xl font-light text-foreground" style={cormorant}>
            Nuestro <em className="font-semibold">equipo</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EQUIPO.map(({ nombre, rol, descripcion, iniciales }) => (
            <div
              key={nombre}
              className="rounded-2xl border border-border bg-surface p-7 text-center hover:shadow-lg hover:shadow-black/5 transition-shadow duration-300"
            >
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-accent/20 flex items-center justify-center mx-auto mb-5"
              >
                <span
                  className="text-2xl font-light text-accent"
                  style={cormorant}
                >
                  {iniciales}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-[15px] mb-0.5" style={syne}>{nombre}</h3>
              <p className="text-[11px] text-accent font-semibold uppercase tracking-wider mb-4" style={syne}>{rol}</p>
              <p className="text-sm text-muted leading-relaxed">{descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] py-20 bg-gradient-to-br from-slate-900 to-[#0b1520]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-orange-300/60 mb-4" style={syne}>
            ¿Listo para empezar?
          </p>
          <h2
            className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight"
            style={cormorant}
          >
            Tu próxima aventura{' '}
            <em className="font-semibold" style={{ color: '#ff9a5c' }}>te espera.</em>
          </h2>
          <p className="text-[14px] text-white/40 mb-10" style={syne}>
            Explora nuestras ofertas o contáctanos y armamos algo a tu medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ofertas"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-sm font-semibold text-white hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/40"
              style={syne}
            >
              Ver ofertas <LuArrowRight size={14} />
            </Link>
            <Link
              href="/destinos"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-8 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
              style={syne}
            >
              Explorar destinos
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
