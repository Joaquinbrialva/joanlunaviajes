import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='w-screen -mx-[calc((100vw-100%)/2)] bg-slate-950 text-slate-100 mt-12'>
      <div className='max-w-7xl mx-auto px-4 py-10 md:px-8 md:py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          <section className='space-y-3'>
            <p className='text-lg font-bold'>Joan Luna Viajes</p>
            <p className='text-sm text-slate-300'>
              Creamos experiencias memorables con itinerarios curados, soporte local y foco en viajes premium.
            </p>
          </section>

          <section className='space-y-2 text-sm'>
            <p className='font-semibold text-white'>Explore</p>
            <Link href='/destinos' className='block text-slate-300 hover:text-white transition-colors'>
              Destinos
            </Link>
            <Link href='/ofertas' className='block text-slate-300 hover:text-white transition-colors'>
              Experiencias
            </Link>
            <a href='#' className='block text-slate-300 hover:text-white transition-colors'>
              Guias de viaje
            </a>
          </section>

          <section className='space-y-2 text-sm'>
            <p className='font-semibold text-white'>Company</p>
            <a href='#' className='block text-slate-300 hover:text-white transition-colors'>
              About us
            </a>
            <a href='#' className='block text-slate-300 hover:text-white transition-colors'>
              Contacto
            </a>
            <a href='#' className='block text-slate-300 hover:text-white transition-colors'>
              Blog
            </a>
          </section>

          <section className='space-y-3'>
            <p className='font-semibold text-white'>Stay inspired</p>
            <p className='text-sm text-slate-300'>
              Recibi ofertas y novedades de destinos.
            </p>
            <form className='flex flex-col sm:flex-row gap-2 w-full'>
              <input
                className='min-w-0 flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400'
                placeholder='tu@email.com'
                type='email'
              />
              <button
                type='button'
                className='h-10 px-4 rounded-lg bg-accent text-white text-sm font-semibold whitespace-nowrap sm:w-auto w-full'
              >
                Suscribirme
              </button>
            </form>
          </section>
        </div>

        <div className='mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-slate-400'>
          <p>© 2026 Joan Luna Viajes. Todos los derechos reservados.</p>
          <div className='flex items-center gap-5'>
            <a href='#' className='hover:text-white transition-colors'>Privacidad</a>
            <a href='#' className='hover:text-white transition-colors'>Terminos</a>
            <a href='#' className='hover:text-white transition-colors'>Soporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
