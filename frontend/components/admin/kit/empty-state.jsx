'use client';

import { EmptyState as HeroEmptyState } from '@heroui/react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <HeroEmptyState className='flex flex-col items-center gap-3 py-14 px-6 text-center'>
      {Icon && (
        <div className='grid h-12 w-12 place-content-center rounded-2xl bg-surface-secondary text-muted/60'>
          <Icon className='h-5 w-5' />
        </div>
      )}
      <div className='space-y-1'>
        <p className='text-sm font-semibold text-foreground'>{title}</p>
        {description && <p className='text-sm text-muted max-w-[38ch]'>{description}</p>}
      </div>
      {action}
    </HeroEmptyState>
  );
}
