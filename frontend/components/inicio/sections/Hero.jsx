'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuMapPin } from 'react-icons/lu';

const C = { fontFamily: 'var(--font-cormorant)' };
const S = { fontFamily: 'var(--font-syne)' };

const STATS = [
  { value: '500+', label: 'Destinos' },
  { value: '15 años', label: 'Experiencia' },
  { value: '98%', label: 'Satisfacción' },
];

const DEFAULT_MEDIA = { type: 'image', url: '/assets/images/hero-img.jpg', poster: null };

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function Hero() {
  const [media, setMedia] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings/hero')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setMedia(data?.url ? data : DEFAULT_MEDIA); })
      .catch(() => { setMedia(DEFAULT_MEDIA); });
  }, []);

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
      {/* ── Media background ── */}
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

      {/* ── Capas de gradiente ── */}
      {/* Oscurecimiento izquierdo para el texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      {/* Vignette superior muy leve */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

      {/* ── Grain ── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />

      {/* ── Contenido ── */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Zona principal — centrada verticalmente */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 pt-[68px]">

            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div
                className="animate-slide-up flex items-center gap-3 mb-7"
                style={{ animationDelay: '0ms' }}
              >
                <div className="h-px w-10 bg-accent" />
                <span
                  className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/55"
                  style={S}
                >
                  Agencia de viajes premium
                </span>
              </div>

              {/* Heading */}
              <h1
                className="animate-slide-up text-white leading-[0.9] mb-7"
                style={{
                  ...C,
                  fontSize: 'clamp(4rem, 9vw, 8.5rem)',
                  fontWeight: 300,
                  animationDelay: '80ms',
                }}
              >
                Destinos que<br />
                <em
                  className="font-semibold"
                  style={{ color: '#ff9a5c', textShadow: '0 0 60px rgba(255,126,45,0.35)' }}
                >
                  transforman.
                </em>
              </h1>

              {/* Subtexto */}
              <p
                className="animate-slide-up text-white/50 mb-10 max-w-sm leading-relaxed"
                style={{ ...S, fontSize: '14px', animationDelay: '160ms' }}
              >
                Diseñamos experiencias de viaje únicas, a medida de a quién eres y lo que buscas.
              </p>

              {/* CTAs */}
              <div
                className="animate-slide-up flex flex-wrap items-center gap-3"
                style={{ animationDelay: '240ms' }}
              >
                <Link
                  href="/consulta"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-white font-semibold text-[13px] hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/35"
                  style={S}
                >
                  Planificar mi viaje
                  <LuArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/destinos"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/20 text-white/85 text-[13px] font-medium hover:bg-white/8 hover:border-white/35 transition-all backdrop-blur-sm"
                  style={S}
                >
                  <LuMapPin className="w-3.5 h-3.5 text-accent" />
                  Explorar destinos
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra inferior ── */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 pb-10 flex items-end justify-between gap-6">

            {/* Stats */}
            <div className="flex items-center gap-8">
              {STATS.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-2 shrink-0">
                  <span
                    className="text-white font-light leading-none"
                    style={{ ...C, fontSize: '32px', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-white/60 text-[11px] tracking-[0.15em] uppercase"
                    style={{ ...S, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                  >
                    {stat.label}
                  </span>
                  {i < STATS.length - 1 && (
                    <div className="ml-4 h-6 w-px bg-white/12" />
                  )}
                </div>
              ))}
            </div>

            {/* Scroll indicator */}
            <div className="hidden sm:flex flex-col items-center gap-2 shrink-0 pb-1" style={{ animation: 'fadeIn 1s ease 1.2s both' }}>
              {/* Mouse icon */}
              <div className="w-[22px] h-[34px] rounded-full border-2 border-white/70 flex justify-center pt-[5px]" style={{ boxShadow: '0 0 12px rgba(0,0,0,0.3)' }}>
                <div
                  className="w-[3px] h-[6px] bg-white rounded-full"
                  style={{ animation: 'scrollWheel 2s ease-in-out infinite' }}
                />
              </div>
              <span
                className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70"
                style={{ ...S, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                Scroll
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollWheel {
          0%   { transform: translateY(0); opacity: 1; }
          60%  { transform: translateY(8px); opacity: 0; }
          61%  { transform: translateY(0); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
