'use client';

import Link from 'next/link';
import { visibleGroups, isNavActive } from './nav-config';

export default function NavList({ role, pathname, onLinkClick }) {
  const groups = visibleGroups(role);

  return (
    <nav className='flex-1 space-y-6 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      {groups.map((group) => (
        <div key={group.label}>
          <p className='mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-surface-night-foreground/25'>
            {group.label}
          </p>
          <div className='space-y-0.5'>
            {group.links.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-accent text-accent-foreground shadow-[0_4px_16px_-4px_rgba(255,126,45,0.45)]'
                      : 'text-surface-night-foreground/45 hover:bg-white/[0.06] hover:text-surface-night-foreground'
                  }`}
                >
                  <Icon className='h-[15px] w-[15px] shrink-0' />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
