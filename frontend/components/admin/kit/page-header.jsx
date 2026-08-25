'use client';

import Link from 'next/link';
import { Breadcrumbs } from '@heroui/react';

export default function PageHeader({ crumbs, title, description, actions }) {
  return (
    <header className='flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between'>
      <div className='min-w-0'>
        {crumbs?.length > 0 && (
          <Breadcrumbs className='mb-1.5'>
            {crumbs.map((c, i) =>
              c.href ? (
                <Breadcrumbs.Item key={i}>
                  <Link href={c.href}>{c.label}</Link>
                </Breadcrumbs.Item>
              ) : (
                <Breadcrumbs.Item key={i}>{c.label}</Breadcrumbs.Item>
              )
            )}
          </Breadcrumbs>
        )}
        <h1 className='text-[1.75rem] font-bold tracking-tight text-foreground leading-tight'>{title}</h1>
        {description && <p className='mt-1 text-sm text-muted max-w-[60ch]'>{description}</p>}
      </div>
      {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
    </header>
  );
}
