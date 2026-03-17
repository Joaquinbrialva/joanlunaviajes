'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Switch } from '@heroui/react';
import { useTheme } from 'next-themes';
import NotificationBell from '@/components/admin/notification-bell';
import {
  LuChevronUp,
  LuClipboardList,
  LuGlobe,
  LuLayoutDashboard,
  LuLogOut,
  LuMapPin,
  LuSettings,
  LuUser,
} from 'react-icons/lu';

const links = [
  { href: '/admin', label: 'Panel', icon: LuLayoutDashboard },
  { href: '/admin/ofertas', label: 'Ofertas', icon: LuClipboardList },
  { href: '/admin/destinos', label: 'Destinos', icon: LuGlobe },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: LuMapPin },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <div className='w-screen -mx-[calc((100vw-100%)/2)] bg-background'>
      <div className='grid min-h-dvh grid-cols-1 md:grid-cols-[260px_1fr]'>
        <aside className='flex flex-col border-r border-default bg-surface p-4 md:sticky md:top-0 md:h-dvh md:overflow-visible md:p-6'>
          <div className='mb-6 flex items-start justify-between gap-2'>
            <div>
              <p className='text-sm uppercase tracking-[0.14em] text-muted'>Panel administrador</p>
              <h1 className='text-2xl font-bold'>Joan Luna Viajes</h1>
            </div>
            <NotificationBell />
          </div>

          <nav className='flex-1 space-y-1'>
            {links
              .filter((item) => !(item.href === '/admin/cotizaciones' && user?.role === 'designer'))
              .map((item) => {
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

          {user && (
            <div className='relative mt-auto border-t border-default pt-4' ref={menuRef}>
              {menuOpen && (
                <div className='absolute inset-x-0 bottom-[calc(100%+0.75rem)] rounded-2xl border border-default bg-surface p-1.5 shadow-xl'>
                  {mounted && (
                    <Switch
                      isSelected={resolvedTheme === 'dark'}
                      onChange={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                      className='flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 hover:bg-surface-secondary'
                    >
                      <Switch.Content className='text-sm text-foreground'>Modo oscuro</Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  )}
                  <Link
                    href='/admin/perfil'
                    onClick={() => setMenuOpen(false)}
                    className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-secondary'
                  >
                    <LuUser className='h-4 w-4 text-accent' />
                    Mi perfil
                  </Link>
                  <Link
                    href='/admin/ajustes'
                    onClick={() => setMenuOpen(false)}
                    className='flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-secondary'
                  >
                    <LuSettings className='h-4 w-4 text-accent' />
                    Ajustes
                  </Link>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10'
                  >
                    <LuLogOut className='h-4 w-4' />
                    Cerrar sesión
                  </button>
                </div>
              )}

              <button
                type='button'
                onClick={() => setMenuOpen((prev) => !prev)}
                className='flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-surface-secondary'
              >
                <div className='grid h-10 w-10 shrink-0 place-content-center rounded-full bg-accent/10 text-sm font-bold text-accent'>
                  {initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold'>{user.name}</p>
                  <p className='text-xs text-muted'>{ROLE_LABELS[user.role] || user.role}</p>
                </div>
                <LuChevronUp className={`h-4 w-4 text-muted transition-transform ${menuOpen ? 'rotate-0' : 'rotate-180'}`} />
              </button>
            </div>
          )}
        </aside>

        <div className='min-w-0'>
          <main className='p-4 md:p-6'>{children}</main>
        </div>
      </div>
    </div>
  );
}
