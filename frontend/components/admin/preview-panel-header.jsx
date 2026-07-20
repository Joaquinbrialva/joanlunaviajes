'use client';

import { LuX } from 'react-icons/lu';

const DOT_TONES = {
  success: 'bg-emerald-500',
  neutral: 'bg-muted',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

const TAG_TONES = {
  neutral: 'bg-surface-secondary text-foreground/70',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export function StatusDot({ tone = 'neutral' }) {
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONES[tone] || DOT_TONES.neutral}`} />;
}

export function Tag({ children, icon: Icon, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${TAG_TONES[tone] || TAG_TONES.neutral}`}>
      {Icon && <Icon className='h-2.5 w-2.5' />}
      {children}
    </span>
  );
}

export default function PreviewPanelHeader({
  image,
  fallbackIcon: FallbackIcon,
  title,
  subtitle,
  status,
  meta = [],
  tags = [],
  onClose,
}) {
  return (
    <div className='shrink-0 border-b border-default px-5 py-4'>
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
          <div className='mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted'>
            {status && (
              <span className='flex items-center gap-1.5'>
                <StatusDot tone={status.tone} />
                {status.label}
              </span>
            )}
            {meta.map((m, i) => (
              <span key={i} className={i > 0 || status ? "before:content-['·'] before:mr-1.5 before:text-muted/50" : ''}>
                {m}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
        >
          <LuX className='h-4 w-4' />
        </button>
      </div>
      {tags.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {tags.map((t, i) => (
            <Tag key={i} icon={t.icon} tone={t.tone}>{t.label}</Tag>
          ))}
        </div>
      )}
    </div>
  );
}
