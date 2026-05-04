'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

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

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: grain }}
      />
    </section>
  );
}
