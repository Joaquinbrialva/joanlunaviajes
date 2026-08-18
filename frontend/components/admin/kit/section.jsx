'use client';

/**
 * Standard content panel: rounded surface, one border weight, one radius.
 * Used for table wrappers, form groups, dashboard panels — replaces the
 * repeated `rounded-2xl border border-default bg-surface` string that used
 * to get typed out (slightly differently) on every page.
 */
export default function Section({ as: Tag = 'section', title, description, actions, className = '', bodyClassName = '', children }) {
  const hasHeader = title || description || actions;
  return (
    <Tag className={`rounded-2xl border border-default bg-surface ${className}`}>
      {hasHeader && (
        <div className='flex items-center justify-between gap-3 border-b border-default px-5 py-4'>
          <div className='min-w-0'>
            {title && <h2 className='text-base font-semibold text-foreground'>{title}</h2>}
            {description && <p className='mt-0.5 text-xs text-muted'>{description}</p>}
          </div>
          {actions && <div className='shrink-0'>{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Tag>
  );
}
