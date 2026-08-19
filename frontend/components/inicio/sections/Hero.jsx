'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import HeroSearchWidget from '@/components/inicio/ui/HeroSearchWidget';

const SLIDE_INTERVAL_MS = 15000;

function novedadMedia(novedad) {
	if (Array.isArray(novedad.media) && novedad.media.length > 0) return novedad.media[0];
	return { url: novedad.images?.[0], type: 'image' };
}

function NovedadSlideVideo({ item, onReady }) {
	const ref = useRef(null);
	const start = item.trimStart || 0;
	const end = item.trimEnd || null;

	function handleTimeUpdate() {
		const v = ref.current;
		if (!v) return;
		if (v.currentTime < start || (end && v.currentTime >= end)) {
			v.currentTime = start;
		}
	}

	const zoom = item.zoom || 1;
	const fp = item.focalPoint || { x: 50, y: 50 };
	const style = {
		objectPosition: `${fp.x}% ${fp.y}%`,
		transform: zoom > 1 ? `scale(${zoom})` : undefined,
	};

	return (
		<video
			ref={ref}
			src={item.url}
			autoPlay
			muted
			loop
			playsInline
			preload="metadata"
			onLoadedData={() => {
				if (ref.current) ref.current.currentTime = start;
				onReady?.();
			}}
			onTimeUpdate={handleTimeUpdate}
			className="absolute inset-0 w-full h-full object-cover"
			style={style}
		/>
	);
}

export default function Hero() {
	const [slides, setSlides] = useState(null); // null = aún no resuelto, [] = sin novedades
	const [mediaReady, setMediaReady] = useState(false);
	const [slideIndex, setSlideIndex] = useState(0);
	const [paused, setPaused] = useState(false);

	useEffect(() => {
		fetch('/api/novedades')
			.then((r) => r.json())
			.then((data) => {
				const published = Array.isArray(data)
					? data.filter((u) => u.status === 'published' && u.images?.length > 0)
					: [];
				setSlides(published);
				if (published.length === 0) setMediaReady(true);
			})
			.catch(() => { setSlides([]); setMediaReady(true); });
	}, []);

	const isCarousel = Array.isArray(slides) && slides.length > 0;
	const heroLoading = slides === null;

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
		<div className="relative" style={{ width: 'calc(100% + 6rem)', marginLeft: '-3rem' }}>
			<section
				className="relative overflow-hidden rounded-2xl bg-background"
				style={{ height: 'clamp(260px, 36vw, 460px)' }}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
			>
				{/* Fondo decorativo — se ve mientras no hay media resuelta o no hay novedades */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-1/4 -left-1/4 w-[70%] aspect-square rounded-full bg-white/10 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
					<div className="absolute -bottom-1/3 -right-1/4 w-[65%] aspect-square rounded-full bg-black/15 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" />
				</div>

				{isCarousel && slides.map((novedad, i) => {
					const item = novedadMedia(novedad);
					return (
						<div
							key={novedad.id}
							className="absolute inset-0"
							style={{
								transform: `translateX(${(i - slideIndex) * 100}%)`,
								transition: 'transform 700ms ease-in-out',
							}}
						>
							{item.type === 'video' ? (
								<NovedadSlideVideo item={item} onReady={() => { if (i === 0) setMediaReady(true); }} />
							) : (
								<Image
									src={item.url}
									alt=""
									fill
									priority={i === 0}
									quality={85}
									sizes="100vw"
									onLoad={() => { if (i === 0) setMediaReady(true); }}
									className="object-cover"
								/>
							)}
						</div>
					);
				})}

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

				{/* Skeleton — capa opaca de tope, tapa todo hasta que la sección está lista */}
				<div
					className={`absolute inset-0 z-20 bg-surface-secondary overflow-hidden transition-opacity duration-500 ${
						heroLoading || !mediaReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
					}`}
				>
					<div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
				</div>
			</section>

			{/* Card de búsqueda — superpuesta, se adapta al modo claro/oscuro via tokens del sitio */}
			<div className="relative z-10 -mt-6 pl-12 pr-2">
				<HeroSearchWidget loading={heroLoading || !mediaReady} />
			</div>
		</div>
	);
}
