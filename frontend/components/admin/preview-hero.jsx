'use client';

import { LuX, LuMapPin } from 'react-icons/lu';

const badgeStyles = {
  published: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  draft:     'bg-white/10 text-white/60 border border-white/20',
  featured:  'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  popular:   'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  special:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  lowstock:  'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};

export function StatusBadge({ children, variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm ${badgeStyles[variant] || badgeStyles.draft}`}>
      {children}
    </span>
  );
}

export default function PreviewHero({
  image,
  fallbackIcon: FallbackIcon = LuMapPin,
  eyebrow,
  title,
  meta = [],
  badges = [],
  stats = [],
  onClose,
}) {
  return (
    <div className="relative h-40 md:h-56 shrink-0 overflow-hidden bg-zinc-900">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FallbackIcon className="h-14 w-14 text-white/20" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/20 transition-colors"
      >
        <LuX className="h-4 w-4" />
      </button>

      {badges.length > 0 && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-4rem)]">
          {badges.map((b, i) => (
            <StatusBadge key={i} variant={b.variant}>{b.label}</StatusBadge>
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
        {eyebrow && (
          <p className="text-white/50 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-white font-bold text-2xl md:text-3xl leading-snug tracking-tight drop-shadow-sm">
          {title}
        </h2>
        {meta.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60 text-xs mt-2">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {m.icon && <m.icon className="h-3 w-3 shrink-0" />}
                {m.text}
              </span>
            ))}
          </p>
        )}
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {stats.map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 backdrop-blur-md border px-3 py-1.5 rounded-full text-xs font-bold ${s.tone === 'danger' ? 'bg-rose-500/20 border-rose-400/30 text-rose-300' : 'bg-white/10 border-white/15 text-white'}`}
              >
                {s.icon && <s.icon className="h-3 w-3" />}
                {s.text}
                {s.highlight && (
                  <span className={s.highlightTone === 'positive' ? 'text-emerald-400 text-[10px] font-bold' : 'text-[10px] font-normal opacity-70'}>
                    {s.highlight}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
