'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const DEFAULT_MEDIA = { type: 'image', url: '/assets/images/hero-img.jpg', poster: null };

const syne      = { fontFamily: 'var(--font-syne)' };
const cormorant = { fontFamily: 'var(--font-cormorant)' };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

function scrollToCotizar() {
  document.getElementById('cotizar')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero() {
  const [media, setMedia]           = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [textIn, setTextIn]         = useState(false);
  const videoRef                    = useRef(null);

  useEffect(() => {
    fetch('/api/settings/hero')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setMedia(data?.url ? data : DEFAULT_MEDIA); })
      .catch(() => { setMedia(DEFAULT_MEDIA); });
  }, []);

  useEffect(() => {
    if (mediaReady) {
      const t = setTimeout(() => setTextIn(true), 200);
      return () => clearTimeout(t);
    }
  }, [mediaReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [media?.type, media?.url]);

  if (!media) {
    return (
      <section
        className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] bg-[#080f16]"
        style={{ height: 'calc(100vh + 68px)', minHeight: '640px' }}
      />
    );
  }

  return (
    <section
      className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] relative overflow-hidden"
      style={{ height: 'calc(100vh + 68px)', minHeight: '640px' }}
    >
      {/* ── Media background ──────────────────────────────── */}
      {media.type === 'video' ? (
        <video
          ref={videoRef}
          key={media.url}
          autoPlay muted loop playsInline
          preload="metadata"
          poster={media.poster || undefined}
          onLoadedData={() => setMediaReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={media.url} />
        </video>
      ) : (
        <Image
          src={media.url}
          alt="Destino de viaje"
          fill priority quality={85} sizes="100vw"
          onLoad={() => setMediaReady(true)}
          className={`object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
          style={media.focalPoint ? { objectPosition: `${media.focalPoint.x}% ${media.focalPoint.y}%` } : undefined}
        />
      )}
      {!mediaReady && <div className="absolute inset-0 bg-[#080f16]" />}

      {/* ── Grain ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />

      {/* ── Gradient overlay (bottom-heavy) ───────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />

      {/* ── Text content ──────────────────────────────────── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-[min(12vh,90px)] px-6"
        style={{
          opacity:    textIn ? 1 : 0,
          transform:  textIn ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.9s ease, transform 0.9s ease',
        }}
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px w-8 bg-white/30" />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45"
            style={syne}
          >
            Agencia de viajes · Buenos Aires
          </span>
          <div className="h-px w-8 bg-white/30" />
        </div>

        {/* Heading */}
        <h1
          className="text-center font-light text-white leading-[1.05] mb-5"
          style={{ ...cormorant, fontSize: 'clamp(44px, 8vw, 90px)' }}
        >
          Descubrí tu próximo{' '}
          <em className="font-semibold" style={{ color: '#ff9a5c' }}>
            destino.
          </em>
        </h1>

        {/* Subline */}
        <p
          className="text-center mb-9 max-w-md"
          style={{ ...syne, fontSize: 13.5, color: 'rgba(255,255,255,0.52)', lineHeight: 1.7 }}
        >
          Itinerarios curados, atención 100% personalizada y precios exclusivos.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={scrollToCotizar}
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          style={{
            ...syne,
            height: 52,
            padding: '0 32px',
            borderRadius: 9999,
            background: 'linear-gradient(135deg, #ff7e2d, #ff5500)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 10px 36px rgba(255,126,45,0.45)',
            letterSpacing: '0.01em',
          }}
        >
          Cotizá tu viaje
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>

        {/* Scroll indicator */}
        <div className="mt-10 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-white/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
