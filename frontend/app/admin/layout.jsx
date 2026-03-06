'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LuClipboardList, LuGlobe, LuLayoutDashboard, LuLogOut, LuMapPin, LuPlus } from 'react-icons/lu';

const links = [
  { href: '/admin', label: 'Panel', icon: LuLayoutDashboard },
  { href: '/admin/ofertas', label: 'Ofertas', icon: LuClipboardList },
  { href: '/admin/destinos', label: 'Destinos', icon: LuGlobe },
  { href: '/admin/destinos/nuevo', label: 'Nuevo destino', icon: LuPlus },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: LuMapPin },
  { href: '/admin/ofertas/nueva', label: 'Nueva oferta', icon: LuPlus },
];

const ROLE_LABELS = {
  admin: 'Administrador',
  agent: 'Agente',
  designer: 'Diseñador',
};

function isActive(pathname, href) {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <div className='w-screen -mx-[calc((100vw-100%)/2)] bg-background min-h-[calc(100vh-5rem)]'>
      <div className='grid grid-cols-1 md:grid-cols-[260px_1fr]'>
        <aside className='border-r border-default bg-surface p-4 md:p-6 flex flex-col'>
          <div className='mb-6'>
            <p className='text-sm uppercase tracking-[0.14em] text-muted'>Panel administrador</p>
            <h1 className='text-2xl font-bold'>Joan Luna Viajes</h1>
          </div>

          <nav className='space-y-1 flex-1'>
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

          {/* User info + logout */}
          {user && (
            <div className='mt-6 pt-4 border-t border-default'>
              <div className='flex items-center gap-3'>
                <div className='h-8 w-8 rounded-full bg-accent/10 text-accent grid place-content-center text-xs font-bold shrink-0'>
                  {initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold truncate'>{user.name}</p>
                  <p className='text-xs text-muted'>{ROLE_LABELS[user.role] || user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className='text-muted hover:text-danger transition-colors p-1 rounded-lg hover:bg-danger/10'
                  title='Cerrar sesión'
                >
                  <LuLogOut className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className='min-w-0'>
          <header className='h-16 border-b border-default bg-surface px-4 md:px-6 flex items-center justify-between'>
            <div>
              <p className='text-sm text-muted'>Administración</p>
              <p className='font-semibold'>Gestión comercial</p>
            </div>
            <div className='flex items-center gap-3'>
              {user && (
                <span className='text-sm text-muted hidden sm:block'>
                  Hola, <span className='font-medium text-foreground'>{user.name.split(' ')[0]}</span>
                </span>
              )}
              <div className='h-9 w-9 rounded-full bg-accent/10 text-accent grid place-content-center text-sm font-bold'>
                {initials}
              </div>
            </div>
          </header>

          <main className='p-4 md:p-6'>{children}</main>
        </div>
      </div>
    </div>
  );
}
