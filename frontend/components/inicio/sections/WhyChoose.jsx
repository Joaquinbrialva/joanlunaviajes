import { PiShieldCheckFill } from "react-icons/pi";
import { MdPriceCheck, MdSupportAgent } from "react-icons/md";

function Feature({ Icon, title, children }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 px-4">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
        <Icon className="text-orange-400 w-9 h-9" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-white">{title}</p>
      <p className="text-sm text-slate-500 dark:text-gray-300 max-w-xs">{children}</p>
    </div>
  );
}

export default function WhyChoose() {
  return (
    <section className="w-screen -mx-[calc((100vw-100%)/2)] py-12 dark:bg-slate-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature Icon={PiShieldCheckFill} title="Seguridad Garantizada">
            Respaldo total antes, durante y después de tu viaje.
          </Feature>

          <Feature Icon={MdSupportAgent} title="Atención 24/7">
            Equipo de expertos disponibles para ayudarte en todo momento.
          </Feature>

          <Feature Icon={MdPriceCheck} title="Mejores Precios">
            Acceso exclusivo a tarifas y beneficios preferenciales.
          </Feature>
        </div>
      </div>
    </section>
  );
}