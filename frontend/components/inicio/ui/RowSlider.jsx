'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const GAP = 20;

/**
 * Two-row horizontal slider: cards fill a row, then wrap into a second row,
 * then a new column. The visible width is clipped to an exact multiple of
 * card+gap so there's no ragged trailing sliver of a card, and the arrows
 * sit outside that clipped area rather than overlapping the cards.
 */
export default function RowSlider({ children, rows = 2 }) {
  const clipRef = useRef(null);
  const trackRef = useRef(null);
  const scrollDebounceRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [clipWidth, setClipWidth] = useState(null);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const recalcClipWidth = useCallback(() => {
    const clip = clipRef.current;
    const track = trackRef.current;
    if (!clip || !track) return;
    const card = track.querySelector('[data-row-card]');
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const step = cardWidth + GAP;
    const available = clip.parentElement.clientWidth;
    if (!available) return;
    const perView = Math.max(1, Math.floor((available + GAP) / step));
    setClipWidth(perView * step - GAP);
  }, []);

  // Scroll fires on every frame of the native smooth-scroll animation; recomputing
  // edges on each tick fights that animation and makes it stutter. Only recompute
  // once scrolling settles.
  const handleTrackScroll = useCallback(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(updateEdges, 120);
  }, [updateEdges]);

  useEffect(() => {
    const parent = clipRef.current?.parentElement;
    if (!parent) return;
    recalcClipWidth();
    updateEdges();

    const resizeObserver = new ResizeObserver(() => {
      recalcClipWidth();
      updateEdges();
    });
    resizeObserver.observe(parent);
    return () => {
      resizeObserver.disconnect();
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [recalcClipWidth, updateEdges, children]);

  const scrollByAmount = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div ref={clipRef} className="relative" style={clipWidth ? { width: clipWidth } : undefined}>
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          className="scrollbar-hide grid grid-flow-col auto-cols-max gap-5 overflow-x-auto scroll-smooth py-1"
          style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
        >
          {children}
        </div>
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Ver anteriores"
          onClick={() => scrollByAmount(-1)}
          className="absolute right-full top-1/2 mr-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-foreground transition-all duration-300 hover:border-accent hover:text-accent hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent sm:flex"
        >
          <LuChevronLeft size={18} />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="Ver más"
          onClick={() => scrollByAmount(1)}
          className="absolute left-full top-1/2 ml-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-foreground transition-all duration-300 hover:border-accent hover:text-accent hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent sm:flex"
        >
          <LuChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
