'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { LuChevronLeft, LuChevronRight, LuX, LuLayoutGrid } from 'react-icons/lu';

export default function GalleryCollage({ images = [], title = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prev, next]);

  if (!images.length) return null;

  const cover = images[0];
  const side = images.slice(1, 5);
  const hasRight = side.length > 0;

  function openAt(i) {
    setActiveIndex(i);
    setLightboxOpen(true);
  }

  // right-side grid layout
  const rightCols = side.length >= 4 ? 2 : 1;
  const rightRows = side.length >= 3 ? 2 : side.length >= 1 ? Math.min(side.length, 2) : 1;

  return (
    <>
      {/* ── Collage grid ── */}
      <div
        className="relative w-full overflow-hidden rounded-3xl"
        style={{ height: 'clamp(280px, 46vw, 540px)' }}
      >
        <div
          className="grid h-full gap-1.5"
          style={{ gridTemplateColumns: hasRight ? '3fr 2fr' : '1fr' }}
        >
          {/* Large left image */}
          <div
            className="relative cursor-pointer overflow-hidden rounded-l-3xl"
            onClick={() => openAt(0)}
          >
            <Image
              src={cover.url}
              alt={cover.alt || title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
          </div>

          {/* Right side grid */}
          {hasRight && (
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${rightCols}, 1fr)`,
                gridTemplateRows: `repeat(${rightRows}, 1fr)`,
              }}
            >
              {side.map((img, i) => {
                const isLast = i === side.length - 1;
                const isBottomRight =
                  rightCols === 2 ? i === 3 || (side.length < 4 && i === side.length - 1 && i % 2 === 1)
                  : i === side.length - 1;
                return (
                  <div
                    key={img.id || i}
                    className={`relative cursor-pointer overflow-hidden ${
                      isBottomRight ? 'rounded-br-3xl' : ''
                    } ${i === 0 ? 'rounded-tr-3xl' : ''}`}
                    onClick={() => openAt(i + 1)}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-[1.05]"
                      sizes="(max-width: 768px) 50vw, 30vw"
                    />
                    {/* Dim overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* "Ver todas" button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border border-white/50 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
          >
            <LuLayoutGrid size={13} />
            Ver todas las fotos
            <span className="text-muted font-normal">({images.length})</span>
          </button>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/97"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <span className="text-white/50 text-sm">
              {activeIndex + 1} <span className="text-white/25">/</span> {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              aria-label="Cerrar"
            >
              <LuX size={20} />
            </button>
          </div>

          {/* Main image + arrows */}
          <div className="flex-1 relative flex items-center justify-center min-h-0 px-14">
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Anterior"
            >
              <LuChevronLeft size={28} />
            </button>

            <div className="relative w-full h-full">
              <Image
                src={images[activeIndex].url}
                alt={images[activeIndex].alt || title}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Siguiente"
            >
              <LuChevronRight size={28} />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 shrink-0 justify-center">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                  i === activeIndex
                    ? 'ring-2 ring-white opacity-100 scale-105'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{ width: 60, height: 44 }}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ''}
                  fill
                  className="object-cover"
                  sizes="60px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
