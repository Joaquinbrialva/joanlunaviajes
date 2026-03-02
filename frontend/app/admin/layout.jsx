'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuClipboardList, LuGlobe, LuLayoutDashboard, LuMapPin, LuPlus } from 'react-icons/lu';

const links = [
  { href: '/admin', label: 'Panel', icon: LuLayoutDashboard },
  { href: '/admin/ofertas', label: 'Ofertas', icon: LuClipboardList },
  { href: '/admin/destinos', label: 'Destinos', icon: LuGlobe },
  { href: '/admin/destinos/nuevo', label: 'Nuevo destino', icon: LuPlus },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: LuMapPin },
  { href: '/admin/ofertas/nueva', label: 'Nueva oferta', icon: LuPlus },
];

function isActive(pathname, href) {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className='w-screen -mx-[calc((100vw-100%)/2)] bg-background min-h-[calc(100vh-5rem)]'>
      <div className='grid grid-cols-1 md:grid-cols-[260px_1fr]'>
        <aside className='border-r border-default bg-surface p-4 md:p-6'>
          <div className='mb-6'>
            <p className='text-sm uppercase tracking-[0.14em] text-muted'>Panel administrador</p>
            <h1 className='text-2xl font-bold'>Joan Luna Viajes</h1>
          </div>

          <nav className='space-y-2'>
            {links.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent text-white'
                      : 'text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className='min-w-0'>
          <header className='h-16 border-b border-default bg-surface px-4 md:px-6 flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted'>Administración</p>
              <p className='font-semibold'>Gestión comercial</p>
            </div>
            <div className='h-9 w-9 rounded-full bg-surface-secondary grid place-content-center text-sm font-bold'>
              A
            </div>
          </header>

          <main className='p-4 md:p-6'>{children}</main>
        </div>
      </div>
    </div>
  );
}

