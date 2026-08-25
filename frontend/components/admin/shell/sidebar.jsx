'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip } from '@heroui/react';
import { LuArrowUpRight } from 'react-icons/lu';
import Logo from '@/components/ui/logo';
import NavList from './nav-list';

export const RAIL_WIDTH = 240;

export default function Sidebar({ role }) {
  const pathname = usePathname();

  return (
    <aside
      className='fixed inset-y-0 left-0 z-40 hidden flex-col bg-surface-night md:flex'
      style={{ width: RAIL_WIDTH }}
    >
      <div className='flex shrink-0 items-center justify-between px-5 pb-4 pt-5'>
        <Link href='/admin' className='select-none'>
          <Logo className='h-6 w-auto' />
        </Link>
        <Tooltip>
          <Tooltip.Trigger>
            <Link
              href='/'
              target='_blank'
              className='flex h-7 w-7 items-center justify-center rounded-lg text-surface-night-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-surface-night-foreground'
            >
              <LuArrowUpRight className='h-3.5 w-3.5' />
            </Link>
          </Tooltip.Trigger>
          <Tooltip.Content>Ver sitio público</Tooltip.Content>
        </Tooltip>
      </div>

      <NavList role={role} pathname={pathname} />
    </aside>
  );
}
