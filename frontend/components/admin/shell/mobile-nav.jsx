'use client';

import { usePathname } from 'next/navigation';
import { Drawer } from '@heroui/react';
import { LuLogOut, LuUser } from 'react-icons/lu';
import Logo from '@/components/ui/logo';
import { InitialsAvatar } from '@/components/admin/kit';
import { ROLE_LABELS } from './nav-config';
import NavList from './nav-list';
import Link from 'next/link';

export default function MobileNav({ isOpen, onClose, user, onLogout }) {
  const pathname = usePathname();

  return (
    <Drawer isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Backdrop variant='blur'>
        <Drawer.Content placement='left' className='w-[280px] bg-surface-night'>
          <Drawer.Dialog className='relative flex h-full flex-col'>
            <div className='flex shrink-0 items-center justify-between px-5 pb-4 pt-5'>
              <Logo className='h-6 w-auto' />
              <Drawer.CloseTrigger className='text-surface-night-foreground/50' />
            </div>

            <NavList role={user?.role} pathname={pathname} onLinkClick={onClose} />

            {user && (
              <div className='shrink-0 border-t border-white/[0.06] px-3 py-3'>
                <div className='flex items-center gap-3 px-2 py-2'>
                  <InitialsAvatar name={user.name} role={user.role} size='sm' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-[13px] font-semibold leading-tight text-surface-night-foreground'>{user.name}</p>
                    <p className='mt-0.5 truncate text-[10px] text-surface-night-foreground/40'>{ROLE_LABELS[user.role] || user.role}</p>
                  </div>
                </div>
                <div className='mt-1 flex gap-1.5'>
                  <Link
                    href='/admin/perfil'
                    onClick={onClose}
                    className='flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] py-2 text-xs font-medium text-surface-night-foreground/70'
                  >
                    <LuUser className='h-3.5 w-3.5' /> Perfil
                  </Link>
                  <button
                    type='button'
                    onClick={onLogout}
                    className='flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-danger/10 py-2 text-xs font-medium text-danger'
                  >
                    <LuLogOut className='h-3.5 w-3.5' /> Salir
                  </button>
                </div>
              </div>
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
