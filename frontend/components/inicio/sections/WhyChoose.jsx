import { PiShieldCheckFill } from "react-icons/pi";
import { MdPriceCheck, MdSupportAgent } from "react-icons/md";

const syne = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

const FEATURES = [
  {
    num: '01',
    Icon: PiShieldCheckFill,
    title: 'Seguridad Garantizada',
    desc: 'Respaldo total antes, durante y después de tu viaje. Solo trabajamos con operadores certificados y garantizamos cada reserva.',
  },
  {
    num: '02',
    Icon: MdSupportAgent,
    title: 'Atención 24/7',
    desc: 'Equipo de expertos disponibles en todo momento — sin bots, sin formularios automáticos, siempre una persona real.',
  },
  {
    num: '03',
    Icon: MdPriceCheck,
    title: 'Mejores Precios',
    desc: 'Acceso exclusivo a tarifas preferenciales y beneficios que no encuentras en ningún portal de viajes.',
  },
];

export default function WhyChoose() {
  return (
    <section className="w-screen -mx-[calc((100vw-100%)/2)] py-20 bg-surface-secondary dark:bg-slate-900/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">

        {/* Header centrado con líneas decorativas */}
        <div className="flex items-center gap-5 mb-16">
          <div className="h-px flex-1 bg-border/60" />
          <span
            className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted"
            style={syne}
          >
            Por qué elegirnos
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        {/* Tres pilares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden">
          {FEATURES.map(({ num, Icon, title, desc }) => (
            <div
              key={num}
              className="bg-surface dark:bg-slate-900 px-8 py-10 group hover:bg-surface-tertiary dark:hover:bg-slate-800/80 transition-colors duration-300"
            >
              {/* Número decorativo */}
              <span
                className="block text-[64px] leading-none font-light text-foreground/[0.07] dark:text-white/[0.06] select-none mb-6"
                style={cormorant}
              >
                {num}
              </span>

              {/* Icono */}
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-300">
                <Icon className="text-accent w-5 h-5" />
              </div>

              {/* Contenido */}
              <h3
                className="font-semibold text-foreground text-[15px] mb-2.5 leading-snug"
                style={syne}
              >
                {title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
