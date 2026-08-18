'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

export default function OfferSlider({ children }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [updateEdges, children]);

  const scrollByAmount = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-offer-card]');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step * 2, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 py-4"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Ver ofertas anteriores"
          onClick={() => scrollByAmount(-1)}
          className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-foreground transition-all duration-300 hover:border-accent hover:text-accent hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent sm:flex"
        >
          <LuChevronLeft size={18} />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="Ver más ofertas"
          onClick={() => scrollByAmount(1)}
          className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-foreground transition-all duration-300 hover:border-accent hover:text-accent hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent sm:flex"
        >
          <LuChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
