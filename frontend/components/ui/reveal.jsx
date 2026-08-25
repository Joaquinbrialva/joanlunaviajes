'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — scroll-triggered entrance.
 * Defaults to fully visible (SSR-safe, no-JS-safe). Only after mount, if the
 * element is confirmed off-screen, does it hide itself and animate in on
 * intersection — so a slow/failed script never leaves content blank.
 */
export default function Reveal({ children, className = '', delay = 0, y = 24, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (alreadyInView) return;

    // Deliberate: only after confirming (via DOM measurement) that this element
    // starts off-screen do we flip it to hidden, then animate it in on intersect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(false);
    setArmed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      {...rest}
      style={{
        transitionDelay: armed ? `${delay}ms` : '0ms',
        transform: visible ? 'none' : `translateY(${y}px)`,
      }}
      className={`${className} transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </Tag>
  );
}
