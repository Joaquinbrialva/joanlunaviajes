import { LuMessageCircleHeart, LuPlaneTakeoff, LuSearch } from 'react-icons/lu';

const STEPS = [
  {
    num: '01',
    Icon: LuSearch,
    color: 'bg-brand-primary text-brand-primary-foreground',
    title: 'Buscas o nos cuentas tu viaje ideal',
    desc: 'Desde el buscador o el formulario de cotización: destino, fechas y cuántos viajan.',
  },
  {
    num: '02',
    Icon: LuMessageCircleHeart,
    color: 'bg-brand-secondary text-brand-secondary-foreground',
    title: 'Un asesor arma tu propuesta',
    desc: 'En menos de 24 horas recibís una cotización personalizada, sin costo ni compromiso.',
  },
  {
    num: '03',
    Icon: LuPlaneTakeoff,
    color: 'bg-brand-tertiary text-brand-tertiary-foreground',
    title: 'Confirmas y viajas tranquilo',
    desc: 'Coordinamos vuelos, hotel y traslados. Te acompañamos antes, durante y después del viaje.',
  },
];

export default function HowItWorks() {
  return (
    <div className="space-y-10">
      <h2 className="text-center font-extrabold text-foreground leading-tight tracking-tight" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)' }}>
        Así funciona
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
        {STEPS.map(({ num, Icon, color, title, desc }, i) => (
          <div key={num} className="relative flex flex-col items-center text-center px-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 shrink-0 ${color}`}>
              <Icon size={26} strokeWidth={2} />
            </div>
            <span className="text-xs font-bold text-muted mb-2">Paso {num}</span>
            <h3 className="font-bold text-foreground text-[17px] mb-2 leading-snug">{title}</h3>
            <p className="text-sm text-muted leading-relaxed max-w-[260px]">{desc}</p>

            {i < STEPS.length - 1 && (
              <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px bg-border" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
