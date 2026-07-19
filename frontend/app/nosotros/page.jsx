import Link from 'next/link';
import { MdPriceCheck, MdSupportAgent } from 'react-icons/md';
import { PiShieldCheckFill } from 'react-icons/pi';
import { LuArrowRight, LuHeart, LuMapPin, LuUsers } from 'react-icons/lu';

const VALORES = [
  {
    Icon: LuHeart,
    color: 'bg-brand-primary/10 group-hover:bg-brand-primary/20',
    iconColor: 'text-brand-primary',
    title: 'Pasión por viajar',
    description: 'Cada destino que ofrecemos lo conocemos de primera mano. Viajamos, exploramos y seleccionamos solo las experiencias que nos emocionan.',
  },
  {
    Icon: PiShieldCheckFill,
    color: 'bg-brand-secondary/10 group-hover:bg-brand-secondary/20',
    iconColor: 'text-brand-secondary',
    title: 'Confianza y respaldo',
    description: 'Trabajamos con operadores certificados y garantizamos cada reserva que realizamos.',
  },
  {
    Icon: MdSupportAgent,
    color: 'bg-brand-tertiary/10 group-hover:bg-brand-tertiary/20',
    iconColor: 'text-brand-tertiary',
    title: 'Atención personalizada',
    description: 'No somos un bot ni un formulario. Hablas con personas reales que entienden tus necesidades y arman el viaje ideal para ti.',
  },
  {
    Icon: MdPriceCheck,
    color: 'bg-brand-primary/10 group-hover:bg-brand-primary/20',
    iconColor: 'text-brand-primary',
    title: 'Precios honestos',
    description: 'Sin letras chicas ni costos ocultos. Te mostramos exactamente qué incluye cada propuesta antes de que decidas.',
  },
  {
    Icon: LuMapPin,
    color: 'bg-brand-secondary/10 group-hover:bg-brand-secondary/20',
    iconColor: 'text-brand-secondary',
    title: 'Destinos curados',
    description: 'No trabajamos con cualquier destino. Cada lugar fue elegido por su calidad, seguridad y potencial de experiencia.',
  },
  {
    Icon: LuUsers,
    color: 'bg-brand-tertiary/10 group-hover:bg-brand-tertiary/20',
    iconColor: 'text-brand-tertiary',
    title: 'Para todo tipo de viajero',
    description: 'Familias, parejas, grupos o solos. Adaptamos cada propuesta al estilo y ritmo de quien viaja.',
  },
];

export default function NosotrosPage() {
  return (
    <div>

      {/* ── Hero ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden bg-gradient-to-b from-brand-primary/[0.08] to-surface-secondary">
        <div className="relative max-w-3xl mx-auto px-6 sm:px-10 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
            Viajes que se <span className="text-brand-primary">sienten</span>, no solo se ven.
          </h1>
          <p className="text-[16px] text-muted leading-relaxed max-w-xl mx-auto">
            Somos Joanluna Viajes, una agencia con sede en Buenos Aires y una sola obsesión: que cada viaje que organizamos sea memorable. No vendemos paquetes — creamos experiencias a medida.
          </p>
        </div>
      </section>

      {/* ── Historia ── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
          Empezamos con una mochila y muchas ganas
        </h2>
        <div className="space-y-4 text-[15px] text-muted leading-relaxed">
          <p>
            Joanluna Viajes nació de las ganas de ayudar a otros a descubrir algo simple: que un viaje bien planificado puede cambiar la manera de ver el mundo.
          </p>
          <p>
            Hoy somos un equipo de apasionados por los viajes que trabaja todos los días para que tu próxima aventura sea exactamente como la soñaste — o mejor.
          </p>
        </div>
      </section>

      {/* ── Valores ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] py-20 bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground text-center mb-12 tracking-tight">
            Nuestros valores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {VALORES.map(({ Icon, color, iconColor, title, description }) => (
              <div
                key={title}
                className="bg-surface rounded-2xl p-6 border border-border hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors ${color}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-[15px]">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] py-20 bg-surface">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
            Tu próxima aventura <span className="text-brand-primary">te espera.</span>
          </h2>
          <p className="text-[15px] text-muted mb-10">
            Explora nuestras ofertas o contáctanos y armamos algo a tu medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ofertas"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-8 text-sm font-semibold text-brand-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/25"
            >
              Ver ofertas <LuArrowRight size={14} />
            </Link>
            <Link
              href="/destinos"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 text-sm font-semibold text-foreground hover:bg-surface-secondary transition-colors"
            >
              Explorar destinos
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
