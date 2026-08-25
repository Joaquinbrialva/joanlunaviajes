'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dropdown, Menu, Tooltip } from '@heroui/react';
import { LuMoon, LuSun, LuUser, LuSettings, LuLogOut, LuMenu } from 'react-icons/lu';
import NotificationBell from '@/components/admin/notification-bell';
import { InitialsAvatar } from '@/components/admin/kit';
import { ROLE_LABELS } from './nav-config';

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className='h-9 w-9' />;
  const isDark = resolvedTheme === 'dark';
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <button
          type='button'
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className='flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
        >
          {isDark ? <LuSun className='h-4 w-4' /> : <LuMoon className='h-4 w-4' />}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content>{isDark ? 'Tema claro' : 'Tema oscuro'}</Tooltip.Content>
    </Tooltip>
  );
}

function UserMenu({ user, onLogout }) {
  const router = useRouter();
  if (!user) return <div className='h-9 w-9 rounded-full bg-surface-secondary animate-pulse' />;

  return (
    <Dropdown>
      <Dropdown.Trigger className='flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-secondary'>
        <InitialsAvatar name={user.name} role={user.role} size='sm' />
        <span className='hidden max-w-[120px] truncate text-[13px] font-semibold text-foreground sm:block'>
          {user.name}
        </span>
      </Dropdown.Trigger>
      <Dropdown.Popover placement='bottom end' className='min-w-[220px]'>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === 'perfil') router.push('/admin/perfil');
            if (key === 'ajustes') router.push('/admin/ajustes');
            if (key === 'logout') onLogout();
          }}
        >
          <Menu.Section>
            <div className='px-3 py-2'>
              <p className='truncate text-sm font-semibold text-foreground'>{user.name}</p>
              <p className='text-xs text-muted'>{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </Menu.Section>
          <Dropdown.Item id='perfil'>
            <LuUser className='h-4 w-4 text-accent' /> Mi perfil
          </Dropdown.Item>
          <Dropdown.Item id='ajustes'>
            <LuSettings className='h-4 w-4 text-accent' /> Ajustes
          </Dropdown.Item>
          <Dropdown.Item id='logout' className='text-danger'>
            <LuLogOut className='h-4 w-4' /> Cerrar sesión
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export default function Topbar({ user, onLogout, onOpenMobileNav }) {
  return (
    <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-default bg-surface/90 px-4 backdrop-blur md:px-6'>
      <button
        type='button'
        onClick={onOpenMobileNav}
        className='flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground md:hidden'
      >
        <LuMenu className='h-4.5 w-4.5' />
      </button>
      <Link href='/admin' className='text-sm font-semibold text-foreground md:hidden'>
        Panel
      </Link>
      <div className='flex items-center gap-1'>
        <ThemeToggle />
        <NotificationBell />
        <div className='mx-1 h-5 w-px bg-border' />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
