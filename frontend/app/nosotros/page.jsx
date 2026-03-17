import Link from 'next/link';
import { MdPriceCheck, MdSupportAgent } from 'react-icons/md';
import { PiShieldCheckFill } from 'react-icons/pi';
import { LuMapPin, LuHeart, LuUsers } from 'react-icons/lu';
import NewsLetter from '@/components/inicio/sections/NewsLetter';

const valores = [
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
    description: 'No somos un bot ni un formulario. Hablás con personas reales que entienden tus necesidades y arman el viaje ideal para vos.',
  },
  {
    Icon: MdPriceCheck,
    title: 'Precios honestos',
    description: 'Sin letras chicas ni costos ocultos. Te mostramos exactamente qué incluye cada propuesta antes de que decidas.',
  },
  {
    Icon: LuMapPin,
    title: 'Destinos curados',
    description: 'No trabajamos con cualquier destino. Cada lugar en nuestro catálogo fue elegido por su calidad, seguridad y potencial de experiencia.',
  },
  {
    Icon: LuUsers,
    title: 'Para todo tipo de viajero',
    description: 'Familias, parejas, grupos de amigos o viajeros solos. Adaptamos cada propuesta al estilo y ritmo de quien viaja.',
  },
];

const equipo = [
  { nombre: 'Joan Luna', rol: 'Fundadora y directora', descripcion: 'Viajera empedernida con más de 40 países visitados. Fundó la agencia en 2013 con la convicción de que viajar bien es un derecho de todos.' },
  { nombre: 'Martina Ríos', rol: 'Especialista en Europa', descripcion: 'Vivió 3 años en España y recorrió el continente de punta a punta. Es la persona indicada cuando querés armar un itinerario europeo perfecto.' },
  { nombre: 'Lucas Pereyra', rol: 'Especialista en América', descripcion: 'Apasionado por la naturaleza y el ecoturismo. Conoce cada rincón de Sudamérica y te ayuda a descubrir destinos que no encontrás en Google.' },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <section className='w-screen -mx-[calc((100vw-100%)/2)] bg-linear-to-br from-slate-800 to-slate-900 py-20 text-center text-white'>
        <div className='max-w-3xl mx-auto px-4'>
          <p className='text-sm uppercase tracking-widest text-orange-400 font-semibold mb-3'>Sobre nosotros</p>
          <h1 className='text-4xl md:text-5xl font-bold mb-5'>Viajes que se sienten, no solo se ven</h1>
          <p className='text-lg text-gray-300 leading-relaxed'>
            Somos Joan Luna Viajes, una agencia boutique fundada con una sola obsesión: que cada viaje que organizamos sea memorable. No vendemos paquetes, creamos experiencias a medida.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className='max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center'>
        <div>
          <p className='text-sm uppercase tracking-widest text-accent font-semibold mb-2'>Nuestra historia</p>
          <h2 className='text-3xl font-bold mb-4 text-slate-800 dark:text-white'>Empezamos con una mochila y muchas ganas</h2>
          <div className='space-y-4 text-slate-600 dark:text-gray-300 text-sm leading-relaxed'>
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
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-2xl bg-accent/10 p-6 flex flex-col items-center justify-center text-center'>
            <p className='text-4xl font-bold text-accent'>+10</p>
            <p className='text-sm text-slate-600 dark:text-gray-300 mt-1'>años de experiencia</p>
          </div>
          <div className='rounded-2xl bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center justify-center text-center'>
            <p className='text-4xl font-bold text-slate-800 dark:text-white'>+800</p>
            <p className='text-sm text-slate-600 dark:text-gray-300 mt-1'>viajeros felices</p>
          </div>
          <div className='rounded-2xl bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center justify-center text-center'>
            <p className='text-4xl font-bold text-slate-800 dark:text-white'>40+</p>
            <p className='text-sm text-slate-600 dark:text-gray-300 mt-1'>destinos activos</p>
          </div>
          <div className='rounded-2xl bg-accent/10 p-6 flex flex-col items-center justify-center text-center'>
            <p className='text-4xl font-bold text-accent'>100%</p>
            <p className='text-sm text-slate-600 dark:text-gray-300 mt-1'>atención personalizada</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className='w-screen -mx-[calc((100vw-100%)/2)] bg-slate-50 dark:bg-slate-800/50 py-16'>
        <div className='max-w-5xl mx-auto px-4'>
          <div className='text-center mb-10'>
            <p className='text-sm uppercase tracking-widest text-accent font-semibold mb-2'>Lo que nos mueve</p>
            <h2 className='text-3xl font-bold text-slate-800 dark:text-white'>Nuestros valores</h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
            {valores.map(({ Icon, title, description }) => (
              <div key={title} className='bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm'>
                <div className='w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4'>
                  <Icon className='text-accent w-6 h-6' />
                </div>
                <h3 className='font-semibold text-slate-800 dark:text-white mb-2'>{title}</h3>
                <p className='text-sm text-slate-500 dark:text-gray-300 leading-relaxed'>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className='max-w-5xl mx-auto px-4 py-16'>
        <div className='text-center mb-10'>
          <p className='text-sm uppercase tracking-widest text-accent font-semibold mb-2'>Las personas detrás</p>
          <h2 className='text-3xl font-bold text-slate-800 dark:text-white'>Nuestro equipo</h2>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {equipo.map(({ nombre, rol, descripcion }) => (
            <div key={nombre} className='rounded-2xl border border-default bg-surface p-6 text-center'>
              <div className='w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent'>
                {nombre.split(' ').map((w) => w[0]).join('')}
              </div>
              <h3 className='font-semibold text-slate-800 dark:text-white'>{nombre}</h3>
              <p className='text-xs text-accent font-medium mb-3'>{rol}</p>
              <p className='text-sm text-slate-500 dark:text-gray-300 leading-relaxed'>{descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='max-w-3xl mx-auto px-4 pb-16 text-center'>
        <h2 className='text-2xl font-bold text-slate-800 dark:text-white mb-3'>¿Listo para tu próximo viaje?</h2>
        <p className='text-slate-500 dark:text-gray-300 mb-6'>Explorá nuestras ofertas o contactanos y armamos algo a tu medida.</p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Link href='/ofertas' className='inline-flex h-11 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent/90'>
            Ver ofertas
          </Link>
          <Link href='/destinos' className='inline-flex h-11 items-center justify-center rounded-xl border border-default px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary'>
            Explorar destinos
          </Link>
        </div>
      </section>

      <NewsLetter />
    </div>
  );
}
