'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuMapPin } from 'react-icons/lu';

const cormorantStyle = { fontFamily: 'var(--font-cormorant)' };
const syneStyle = { fontFamily: 'var(--font-syne)' };

const STATS = [
  { value: '500+', label: 'destinos' },
  { value: '15 años', label: 'de experiencia' },
  { value: '98%', label: 'satisfacción' },
];

const DEFAULT_MEDIA = { type: 'image', url: '/assets/images/hero-img.jpg', poster: null };

export default function Hero() {
  const [media, setMedia] = useState(DEFAULT_MEDIA);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch('/api/settings/hero')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.url) setMedia(data); })
      .catch(() => {});
  }, []);

  // Pausa el video cuando sale del viewport para ahorrar recursos
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [media.type, media.url]);

  return (
    <section
      className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] relative overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* Media background */}
      {media.type === 'video' ? (
        <video
          ref={videoRef}
          key={media.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.poster || undefined}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={media.url} />
        </video>
      ) : (
        <Image
          src={media.url}
          alt="Destino de viaje"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover"
        />
      )}

      {/* Gradientes oscuros en capas */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

      {/* Textura grain */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Contenido */}
      <div
        className="relative z-10 flex flex-col justify-between"
        style={{ minHeight: '100vh' }}
      >
        {/* Texto principal */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 pt-[88px] pb-12">

            {/* Eyebrow */}
            <div
              className="animate-slide-up flex items-center gap-2.5 mb-6"
              style={{ animationDelay: '0ms' }}
            >
              <div className="h-px w-8 bg-accent" />
              <span
                className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/70"
                style={syneStyle}
              >
                Agencia de viajes premium
              </span>
            </div>

            {/* Titular */}
            <h1
              className="animate-slide-up text-white leading-[0.92] mb-6"
              style={{
                ...cormorantStyle,
                fontSize: 'clamp(3.5rem, 8vw, 7rem)',
                fontWeight: 300,
                animationDelay: '80ms',
              }}
            >
              Destinos que<br />
              <em
                className="font-semibold"
                style={{ color: '#ff9a5c', textShadow: '0 0 40px rgba(255,126,45,0.3)' }}
              >
                transforman.
              </em>
            </h1>

            {/* Subtexto */}
            <p
              className="animate-slide-up text-white/65 mb-10 max-w-md leading-relaxed"
              style={{ ...syneStyle, fontSize: '15px', animationDelay: '160ms' }}
            >
              Diseñamos experiencias de viaje únicas, a medida de quién sos y de lo que buscás.
            </p>

            {/* CTAs */}
            <div
              className="animate-slide-up flex flex-wrap items-center gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href="/consulta"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-white font-semibold text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30"
                style={syneStyle}
              >
                Planificar mi viaje
                <LuArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/destinos"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/25 text-white text-sm font-medium hover:bg-white/10 transition-all backdrop-blur-sm"
                style={syneStyle}
              >
                <LuMapPin className="w-4 h-4 text-accent" />
                Explorar destinos
              </Link>
            </div>

          </div>
        </div>

        {/* Franja de estadísticas */}
        <div className="w-full border-t border-white/10 backdrop-blur-sm bg-black/20">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center gap-8 overflow-x-auto">
            {STATS.map((stat, i) => (
              <div key={i} className="flex items-baseline gap-2 shrink-0">
                <span
                  className="text-white font-bold"
                  style={{ ...cormorantStyle, fontSize: '28px', lineHeight: 1 }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-white/55 text-[12px] tracking-wide uppercase"
                  style={syneStyle}
                >
                  {stat.label}
                </span>
                {i < STATS.length - 1 && (
                  <div className="ml-6 h-8 w-px bg-white/15" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
