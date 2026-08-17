'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Popover } from '@heroui/react';
import NotificationBell from '@/components/admin/notification-bell';
import {
  LuChevronUp,
  LuClipboardList,
  LuGlobe,
  LuHouse,
  LuImage,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMessageSquare,
  LuMoon,
  LuSettings,
  LuSun,
  LuUser,
  LuUsers,
  LuX,
} from 'react-icons/lu';

/* ─── Nav structure ─────────────────────────────────────────── */

const NAV_GROUPS = [
  {
    label: 'Principal',
    links: [
      { href: '/admin', label: 'Panel', icon: LuLayoutDashboard },
      { href: '/', label: 'Ver sitio', icon: LuHouse },
    ],
  },
  {
    label: 'Contenido',
    links: [
      { href: '/admin/ofertas',      label: 'Ofertas',      icon: LuClipboardList },
      { href: '/admin/destinos',     label: 'Destinos',     icon: LuGlobe },
      { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: LuMessageSquare, hideForRoles: ['designer'] },
    ],
  },
  {
    label: 'Administración',
    links: [
      { href: '/admin/apariencia', label: 'Apariencia', icon: LuImage,  showForRoles: ['admin', 'designer'] },
      { href: '/admin/usuarios',   label: 'Usuarios',   icon: LuUsers,  showForRoles: ['admin'] },
    ],
  },
];

const ROLE_LABELS = {
  admin:    'Administrador',
  agent:    'Agente',
  designer: 'Diseñador',
  client:   'Cliente',
};

const ROLE_COLORS = {
  admin:    { bg: 'rgba(255,126,45,0.18)', text: '#ff9a5c' },
  agent:    { bg: 'rgba(56,189,248,0.15)', text: '#7dd3fc' },
  designer: { bg: 'rgba(167,139,250,0.18)', text: '#c4b5fd' },
  client:   { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
};

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

function getInitials(name) {
  if (!name) return 'A';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const EXTRA_LABELS = {
  '/admin/perfil': 'Mi perfil',
  '/admin/ajustes': 'Ajustes',
};

function getPageLabel(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.links) {
      if (isActive(pathname, item.href) && item.href !== '/') return item.label;
    }
  }
  for (const [href, label] of Object.entries(EXTRA_LABELS)) {
    if (pathname.startsWith(href)) return label;
  }
  return 'Panel';
}

/* ─── Nav list (shared between desktop sidebar and mobile drawer) ── */

function NavList({ user, pathname, onLinkClick }) {
  return (
    <nav className='flex-1 overflow-y-scroll px-3 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      {NAV_GROUPS.map((group) => {
        const visible = group.links.filter((item) => {
          if (item.hideForRoles?.includes(user?.role)) return false;
          if (item.showForRoles && !item.showForRoles.includes(user?.role)) return false;
          return true;
        });
        if (!visible.length) return null;
        return (
          <div key={group.label}>
            <p
              className='px-3 mb-1.5 text-[9px] uppercase font-bold tracking-[0.22em]'
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              {group.label}
            </p>
            <div className='space-y-0.5'>
              {visible.map((item) => {
                const Icon   = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className='flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150'
                    style={
                      active
                        ? { background: '#ff7e2d', color: '#12243b', boxShadow: '0 4px 16px rgba(255,126,45,0.35)' }
                        : { color: 'rgba(255,255,255,0.45)' }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                      }
                    }}
                  >
                    <Icon className='h-[15px] w-[15px] shrink-0' />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/* ─── SidebarBrand ───────────────────────────────────────────── */

function SidebarBrand() {
  return (
    <Link href='/admin' className='flex items-baseline gap-0.5 select-none group'>
      <span
        className='text-white text-[13px] font-extrabold tracking-tight uppercase transition-opacity group-hover:opacity-80'
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        JOAN LUNA
      </span>
      <span
        className='text-accent ml-0.5'
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontSize: '16px',
        }}
      >
        viajes
      </span>
    </Link>
  );
}

/* ─── ThemeToggle — single click, no submenu ──────────────────── */

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className='h-9 w-9' />;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type='button'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className='flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
    >
      {isDark ? <LuSun className='h-4 w-4' /> : <LuMoon className='h-4 w-4' />}
    </button>
  );
}

/* ─── UserMenu — lives in the topbar ──────────────────────────── */

function UserMenu({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const initials  = getInitials(user?.name);
  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.client;

  return (
    <Popover placement='bottom end' isOpen={menuOpen} onOpenChange={setMenuOpen}>
      <Popover.Trigger>
        <button
          type='button'
          className='flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-surface-secondary'
        >
          <div
            className='h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold select-none'
            style={{ background: roleColor.bg, color: roleColor.text }}
          >
            {initials}
          </div>
          <div className='hidden sm:block min-w-0 text-left'>
            <p className='text-[13px] font-semibold text-foreground truncate leading-tight max-w-[120px]'>{user.name}</p>
          </div>
          <LuChevronUp
            className='h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200'
            style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </Popover.Trigger>
      <Popover.Content className='rounded-2xl border border-default bg-surface p-1.5 shadow-2xl min-w-[220px]'>
        <Popover.Dialog>
          <div className='px-3 py-2 mb-1 border-b border-default'>
            <p className='text-sm font-semibold truncate'>{user.name}</p>
            <p className='text-xs text-muted'>{ROLE_LABELS[user.role] || user.role}</p>
          </div>
          <Link
            href='/admin/perfil'
            onClick={() => setMenuOpen(false)}
            className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground transition-colors hover:bg-surface-secondary'
          >
            <LuUser className='h-4 w-4 shrink-0 text-accent' />
            Mi perfil
          </Link>
          <Link
            href='/admin/ajustes'
            onClick={() => setMenuOpen(false)}
            className='flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground transition-colors hover:bg-surface-secondary'
          >
            <LuSettings className='h-4 w-4 shrink-0 text-accent' />
            Ajustes
          </Link>
          <button
            type='button'
            onClick={onLogout}
            className='flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-500 transition-colors hover:bg-rose-500/10'
          >
            <LuLogOut className='h-4 w-4 shrink-0' />
            Cerrar sesión
          </button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

/* ─── Layout ────────────────────────────────────────────────── */

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [user, setUser]             = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP: Fixed sidebar — nav-only, single purpose.
      ══════════════════════════════════════════════════════ */}
      <aside
        className='hidden md:flex flex-col fixed top-0 left-0 z-40 overflow-visible'
        style={{ width: 232, height: '100dvh', background: '#0c1018' }}
      >
        <div
          className='px-5 pt-5 pb-4 shrink-0'
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SidebarBrand />
        </div>

        <NavList user={user} pathname={pathname} onLinkClick={undefined} />
      </aside>

      {/* ══════════════════════════════════════════════════════
          DESKTOP: Topbar — page context + utilities. Lives above
          the content column only, never over the sidebar.
      ══════════════════════════════════════════════════════ */}
      <header
        className='hidden md:flex fixed top-0 right-0 z-30 h-14 items-center justify-between border-b border-default bg-surface px-6'
        style={{ left: 232 }}
      >
        <p className='text-sm font-semibold text-foreground'>{getPageLabel(pathname)}</p>
        <div className='flex items-center gap-1.5'>
          <ThemeToggle />
          <NotificationBell />
          <div className='ml-1 h-5 w-px bg-border' />
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          MOBILE: Fixed top bar + slide-in drawer
      ══════════════════════════════════════════════════════ */}
      <div
        className='md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center px-4 justify-between shrink-0'
        style={{ background: '#0c1018', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarBrand />
        <div className='flex items-center gap-3'>
          <NotificationBell />
          <button
            type='button'
            onClick={() => setMobileOpen(true)}
            className='h-8 w-8 flex items-center justify-center rounded-lg transition-colors'
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            <LuMenu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      <div
        className='md:hidden fixed inset-0 z-50 bg-black/60 transition-opacity duration-300'
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer panel */}
      <div
        className='md:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-hidden'
        style={{
          width: 280,
          background: '#0c1018',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className='px-5 pt-5 pb-4 flex items-center justify-between shrink-0'
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <SidebarBrand />
          <button
            type='button'
            onClick={() => setMobileOpen(false)}
            className='h-8 w-8 flex items-center justify-center rounded-lg'
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <LuX size={18} />
          </button>
        </div>
        <NavList user={user} pathname={pathname} onLinkClick={() => setMobileOpen(false)} />

        {/* User footer — mobile only, no separate topbar to host it */}
        {user && (
          <div className='px-3 py-3 shrink-0' style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className='flex items-center gap-3 px-2.5 py-2.5'>
              <div
                className='h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold select-none'
                style={{
                  background: (ROLE_COLORS[user.role] || ROLE_COLORS.client).bg,
                  color: (ROLE_COLORS[user.role] || ROLE_COLORS.client).text,
                }}
              >
                {getInitials(user.name)}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-[13px] font-semibold text-white truncate leading-tight'>{user.name}</p>
                <p className='text-[10px] truncate mt-0.5' style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {ROLE_LABELS[user.role] || user.role}
                </p>
              </div>
            </div>
            <div className='flex gap-1.5 mt-1'>
              <Link
                href='/admin/perfil'
                className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium'
                style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)' }}
              >
                <LuUser className='h-3.5 w-3.5' /> Perfil
              </Link>
              <button
                type='button'
                onClick={handleLogout}
                className='flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium'
                style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
              >
                <LuLogOut className='h-3.5 w-3.5' /> Salir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT: Normal document flow, scrolls naturally.
      ══════════════════════════════════════════════════════ */}
      <div className='bg-background min-h-dvh'>
        <main className='p-4 pt-[calc(3.5rem+1rem)] md:p-7 md:pt-[calc(3.5rem+1.75rem)] md:pl-[calc(232px+1.75rem)]'>
          {children}
        </main>
      </div>
    </>
  );
}
