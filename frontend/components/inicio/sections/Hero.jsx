'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '@heroui/react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import HeroSearchWidget from '@/components/inicio/ui/HeroSearchWidget';

const SLIDE_INTERVAL_MS = 5000;

export default function Hero() {
	// Sin imagen local por defecto: el loader tapa todo hasta que la media
	// de la DB (o su ausencia) queda resuelta.
	const [media, setMedia] = useState(null);
	const [mediaReady, setMediaReady] = useState(false);
	const [heroSettingsLoaded, setHeroSettingsLoaded] = useState(false);
	const [slides, setSlides] = useState(null); // null = aún no resuelto, [] = sin novedades
	const [slideIndex, setSlideIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const videoRef = useRef(null);

	useEffect(() => {
		fetch('/api/settings/hero')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => { if (data?.url) setMedia(data); })
			.catch(() => {})
			.finally(() => setHeroSettingsLoaded(true));

		fetch('/api/novedades')
			.then((r) => r.json())
			.then((data) => {
				const published = Array.isArray(data)
					? data.filter((u) => u.status === 'published' && u.images?.length > 0)
					: [];
				setSlides(published);
			})
			.catch(() => setSlides([]));
	}, []);

	const isCarousel = Array.isArray(slides) && slides.length > 0;
	const heroLoading = !heroSettingsLoaded || slides === null;

	useEffect(() => {
		const video = videoRef.current;
		if (!video || isCarousel) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) video.play().catch(() => {});
				else video.pause();
			},
			{ threshold: 0.25 }
		);
		observer.observe(video);
		return () => observer.disconnect();
	}, [media?.type, media?.url, isCarousel]);

	useEffect(() => {
		if (!isCarousel || paused || slides.length < 2) return;
		const t = setInterval(() => {
			setSlideIndex((i) => (i + 1) % slides.length);
		}, SLIDE_INTERVAL_MS);
		return () => clearInterval(t);
	}, [isCarousel, paused, slides?.length]);

	function goPrev() {
		setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
	}
	function goNext() {
		setSlideIndex((i) => (i + 1) % slides.length);
	}

	return (
		<div className="relative">
			<section
				className="relative overflow-hidden rounded-2xl bg-background"
				style={{ height: 'clamp(220px, 32vw, 400px)' }}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				{/* Fondo decorativo — se ve mientras no hay media resuelta */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-1/4 -left-1/4 w-[70%] aspect-square rounded-full bg-white/10 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
					<div className="absolute -bottom-1/3 -right-1/4 w-[65%] aspect-square rounded-full bg-black/15 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" />
				</div>

				{isCarousel ? (
					slides.map((novedad, i) => (
						<Image
							key={novedad.id}
							src={novedad.images[0]}
							alt=""
							fill
							priority={i === 0}
							quality={85}
							sizes="100vw"
							onLoad={() => { if (i === 0) setMediaReady(true); }}
							className={`object-cover transition-opacity duration-700 ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
						/>
					))
				) : media?.type === 'video' ? (
					<video
						ref={videoRef}
						key={media.url}
						autoPlay
						muted
						loop
						playsInline
						preload="metadata"
						poster={media.poster || undefined}
						onLoadedData={() => setMediaReady(true)}
						className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
					>
						<source src={media.url} />
					</video>
				) : media?.url ? (
					<Image
						src={media.url}
						alt="Destino de viaje"
						fill
						priority
						quality={85}
						sizes="100vw"
						onLoad={() => setMediaReady(true)}
						className={`object-cover transition-opacity duration-700 ${mediaReady ? 'opacity-100' : 'opacity-0'}`}
						style={media.focalPoint ? { objectPosition: `${media.focalPoint.x}% ${media.focalPoint.y}%` } : undefined}
					/>
				) : null}

				{isCarousel && slides.length > 1 && (
					<>
						<button
							type="button"
							onClick={goPrev}
							aria-label="Novedad anterior"
							className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
						>
							<LuChevronLeft size={22} />
						</button>
						<button
							type="button"
							onClick={goNext}
							aria-label="Siguiente novedad"
							className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
						>
							<LuChevronRight size={22} />
						</button>
					</>
				)}

				{/* Loader — capa opaca de tope, tapa todo hasta que la sección está lista */}
				<div
					className={`absolute inset-0 z-20 flex items-center justify-center bg-background transition-opacity duration-500 ${
						heroLoading || !mediaReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
					}`}
				>
					<Spinner size="lg" />
				</div>
			</section>

			{/* Card de búsqueda — superpuesta, se adapta al modo claro/oscuro via tokens del sitio */}
			<div className="relative z-10 -mt-6 flex justify-center px-2">
				<HeroSearchWidget />
			</div>
		</div>
	);
}
