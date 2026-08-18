'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { LuX, LuChevronLeft, LuChevronRight } from 'react-icons/lu';

function StoryLightbox({ novedad, onClose }) {
  const images = novedad.images;
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col bg-black/97'
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className='flex items-center justify-between px-5 py-3 shrink-0'>
        <span className='text-white/50 text-sm'>
          {index + 1} <span className='text-white/25'>/</span> {images.length}
        </span>
        <button type='button' onClick={onClose} className='text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10' aria-label='Cerrar'>
          <LuX size={20} />
        </button>
      </div>

      <div className='flex-1 relative flex items-center justify-center min-h-0 px-14'>
        {images.length > 1 && (
          <button type='button' onClick={prev} className='absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10' aria-label='Anterior'>
            <LuChevronLeft size={28} />
          </button>
        )}

        <div className='relative w-full h-full'>
          <Image src={images[index]} alt={novedad.caption || 'Novedad'} fill className='object-contain' sizes='100vw' />
        </div>

        {images.length > 1 && (
          <button type='button' onClick={next} className='absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10' aria-label='Siguiente'>
            <LuChevronRight size={28} />
          </button>
        )}
      </div>

      {novedad.caption && (
        <p className='shrink-0 px-6 pb-4 text-center text-sm text-white/80'>{novedad.caption}</p>
      )}
    </div>
  );
}

export default function Novedades() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch('/api/novedades')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUpdates(data.filter((u) => u.status === 'published' && u.images?.length > 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || updates.length === 0) return null;

  return (
    <div className='space-y-5'>
      <h2 className='font-extrabold text-foreground leading-tight tracking-tight' style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
        Novedades
      </h2>

      <div className='flex gap-4 overflow-x-auto pb-2'>
        {updates.map((novedad) => (
          <button
            key={novedad.id}
            type='button'
            onClick={() => setActive(novedad)}
            className='flex shrink-0 flex-col items-center gap-2'
          >
            <span className='relative block h-20 w-20 overflow-hidden rounded-full ring-2 ring-accent ring-offset-2 ring-offset-background transition-transform hover:scale-105 sm:h-24 sm:w-24'>
              <Image src={novedad.images[0]} alt={novedad.caption || 'Novedad'} fill className='object-cover' sizes='96px' />
            </span>
            {novedad.caption && (
              <span className='max-w-[80px] truncate text-xs text-muted'>{novedad.caption}</span>
            )}
          </button>
        ))}
      </div>

      {active && <StoryLightbox novedad={active} onClose={() => setActive(null)} />}
    </div>
  );
}
