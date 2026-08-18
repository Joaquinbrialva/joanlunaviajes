'use client';

import { Chip } from '@heroui/react';

/** Rich header for record-preview panels: thumbnail, title, status chip, meta, tag chips. */
export default function PreviewHeader({ image, fallbackIcon: FallbackIcon, title, subtitle, statusColor, statusLabel, meta = [], tags = [] }) {
  return (
    <div className='flex items-start gap-3'>
      <div className='h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-secondary'>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt='' className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full w-full items-center justify-center'>
            <FallbackIcon className='h-5 w-5 text-muted' />
          </div>
        )}
      </div>
      <div className='min-w-0 flex-1 pt-0.5'>
        {subtitle && <p className='truncate text-[11px] font-medium text-muted'>{subtitle}</p>}
        <h2 className='truncate text-[15px] font-semibold leading-tight text-foreground'>{title}</h2>
        <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
          {statusLabel && (
            <Chip color={statusColor} size='sm'>
              <Chip.Label>{statusLabel}</Chip.Label>
            </Chip>
          )}
          {meta.map((m, i) => (
            <span key={i} className='text-xs text-muted'>{m}</span>
          ))}
        </div>
        {tags.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {tags.map((t, i) => (
              <Chip key={i} color={t.color || 'default'} variant='soft' size='sm'>
                <Chip.Label className='flex items-center gap-1'>
                  {t.icon && <t.icon className='h-2.5 w-2.5' />}
                  {t.label}
                </Chip.Label>
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
