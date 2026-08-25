import Link from 'next/link';
import Logo from '@/components/ui/logo';
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { LuMapPin, LuArrowUpRight } from 'react-icons/lu';

const EXPLORE = [
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Destinos', href: '/destinos' },
  { label: 'Cotizar', href: '/#cotizar' },
];

const AGENCY = [
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
];

const SOCIALS = [
  { Icon: FaWhatsapp, href: 'https://wa.me/541158139420', label: 'WhatsApp' },
  { Icon: FaInstagram, href: 'https://www.instagram.com/p/DNOOawNOtbG/', label: 'Instagram' },
  { Icon: FaFacebook, href: 'https://www.facebook.com/JoanLunaViajes/', label: 'Facebook' },
];

export default function Footer() {
  return (
    <footer className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden bg-surface-night text-slate-100">
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 pt-16 pb-10">

        {/* Franja superior — CTA + dirección */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/[0.07]">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center select-none mb-5">
              <Logo className="h-7 w-auto" />
            </Link>
            <h3 className="font-extrabold leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              Tu puerta al mundo, sin escalas de trámites.
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/10 transition-colors duration-200"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10 md:gap-8 py-12 border-b border-white/[0.07]">

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Dónde estamos
            </p>
            <a
              href="https://maps.google.com/?q=Av.+Corrientes+2174+Local+192,+Buenos+Aires"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 text-sm text-slate-400 hover:text-white transition-colors duration-200 group max-w-[240px]"
            >
              <LuMapPin size={16} className="text-brand-primary shrink-0 mt-0.5" />
              <span>
                Av. Corrientes 2174, Local 192, CABA
                <LuArrowUpRight size={12} className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </a>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Explorar
            </p>
            <nav className="space-y-2.5">
              {EXPLORE.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              Agencia
            </p>
            <nav className="space-y-2.5">
              {AGENCY.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-sm text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
              ¿Arrancamos?
            </p>
            <a
              href="https://wa.me/541158139420"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-brand-primary text-brand-primary-foreground text-[13px] font-bold hover:opacity-90 transition-opacity"
            >
              <FaWhatsapp size={15} />
              Escribinos ya
            </a>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Joanluna Viajes. Todos los derechos reservados.</p>
          <p>Buenos Aires, Argentina</p>
        </div>
      </div>
    </footer>
  );
}
