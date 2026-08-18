'use client';

/** Label/value row + labeled group, shared by the preview drawers (offer, destination, inquiry). */
export function DetailRow({ label, children }) {
  return (
    <div className='flex gap-4 border-b border-default py-2 last:border-0'>
      <span className='w-28 shrink-0 pt-0.5 text-xs text-muted'>{label}</span>
      <span className='min-w-0 flex-1 text-sm'>{children}</span>
    </div>
  );
}

export function DetailSection({ title, icon: Icon, children }) {
  return (
    <div className='px-5 py-4'>
      <div className='mb-2.5 flex items-center gap-1.5'>
        {Icon && <Icon className='h-3 w-3 text-muted' />}
        <p className='text-[11px] font-semibold uppercase tracking-wide text-muted'>{title}</p>
      </div>
      {children}
    </div>
  );
}

export function TagPills({ items, tone = 'default' }) {
  if (!items?.length) return <span className='text-sm text-muted'>—</span>;
  const cls = {
    default: 'bg-surface-secondary text-foreground/70',
    accent: 'bg-accent/10 text-accent',
  }[tone];
  return (
    <ul className='flex flex-wrap gap-1.5'>
      {items.map((item, i) => (
        <li key={i} className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{item}</li>
      ))}
    </ul>
  );
}
