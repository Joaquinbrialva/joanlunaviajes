'use client';

import { useEffect, useState } from 'react';
import { LuArrowUp } from 'react-icons/lu';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-accent text-white shadow-lg shadow-orange-500/30 flex items-center justify-center hover:bg-orange-500 hover:scale-110 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
        transition: 'opacity 300ms, transform 300ms',
      }}
    >
      <LuArrowUp className="w-4 h-4" />
    </button>
  );
}
