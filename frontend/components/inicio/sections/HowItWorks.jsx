import { LuMessageCircleHeart, LuPlaneTakeoff, LuSearch } from 'react-icons/lu';
import Reveal from '@/components/ui/reveal';

const STOPS = [
  {
    code: 'BUE',
    Icon: LuSearch,
    color: 'bg-brand-primary text-brand-primary-foreground',
    title: 'Nos contás tu viaje ideal',
    desc: 'Desde el buscador o el formulario: destino, fechas y cuántos viajan.',
  },
  {
    code: 'PLAN',
    Icon: LuMessageCircleHeart,
    color: 'bg-brand-secondary text-brand-secondary-foreground',
    title: 'Un asesor arma tu propuesta',
    desc: 'En menos de 24 horas recibís una cotización a medida, sin costo ni compromiso.',
  },
  {
    code: 'GO',
    Icon: LuPlaneTakeoff,
    color: 'bg-brand-tertiary text-brand-tertiary-foreground',
    title: 'Confirmás y viajás tranquilo',
    desc: 'Coordinamos vuelos, hotel y traslados. Te acompañamos antes, durante y después.',
  },
];

export default function HowItWorks() {
  return (
    <div className="rounded-[32px] bg-surface-secondary px-6 py-14 sm:px-12 sm:py-20 overflow-hidden">
      <div className="max-w-2xl mx-auto text-center mb-14 sm:mb-20">
        <h2 className="font-extrabold text-foreground leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(2rem, 4.2vw, 3rem)' }}>
          Tu itinerario, en tres tramos
        </h2>
        <p className="text-muted mt-3 text-[15px]">Del primer clic al embarque, te acompañamos en cada escala.</p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-6">
        {/* Ruta de vuelo — línea punteada con avión */}
        <svg
          className="hidden md:block absolute left-0 right-0 top-8 w-full h-6 pointer-events-none"
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="16" y1="3" x2="84" y2="3" stroke="var(--border)" strokeWidth="0.4" strokeDasharray="1.6 2.4" strokeLinecap="round" />
        </svg>

        {STOPS.map(({ code, Icon, color, title, desc }, i) => (
          <Reveal key={code} delay={i * 120} className="relative flex flex-col items-center text-center px-4">
            <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-6 shrink-0 ring-8 ring-surface-secondary ${color}`}>
              <Icon size={26} strokeWidth={2} />
            </div>
            <span className="font-mono text-[11px] font-bold text-muted mb-2 tracking-widest">{code} — TRAMO {i + 1}</span>
            <h3 className="font-bold text-foreground text-[18px] mb-2 leading-snug">{title}</h3>
            <p className="text-sm text-muted leading-relaxed max-w-[250px]">{desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
