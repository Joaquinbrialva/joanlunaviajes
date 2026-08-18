'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Spinner } from '@heroui/react';
import { LuSearch } from 'react-icons/lu';

const SLIDE_INTERVAL_MS = 5000;

export default function Hero() {
	// Sin imagen local por defecto: el loader tapa todo hasta que la media
	// de la DB (o su ausencia) queda resuelta.
	const [media, setMedia] = useState(null);
	const [mediaReady, setMediaReady] = useState(false);
	const [heroSettingsLoaded, setHeroSettingsLoaded] = useState(false);
	const [slides, setSlides] = useState(null); // null = aún no resuelto, [] = sin novedades
	const [slideIndex, setSlideIndex] = useState(0);
	const [textIn, setTextIn] = useState(false);
	const [query, setQuery] = useState('');
	const videoRef = useRef(null);
	const router = useRouter();

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
		// El texto entra recién cuando el loader terminó (media resuelta o
		// descartada), así no se ve nada hasta que la sección está lista.
		if (heroLoading) return;
		const t = setTimeout(() => setTextIn(true), 100);
		return () => clearTimeout(t);
	}, [heroLoading]);

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

	const [paused, setPaused] = useState(false);
	useEffect(() => {
		if (!isCarousel || paused) return;
		const t = setInterval(() => {
			setSlideIndex((i) => (i + 1) % slides.length);
		}, SLIDE_INTERVAL_MS);
		return () => clearInterval(t);
	}, [isCarousel, paused, slides?.length]);

	function handleSearch(e) {
		e.preventDefault();
		const trimmed = query.trim();
		router.push(trimmed ? `/ofertas?q=${encodeURIComponent(trimmed)}` : '/ofertas');
	}

	const searchForm = (
		<form
			onSubmit={handleSearch}
			className="w-full max-w-xl flex items-center gap-2 p-2 rounded-2xl bg-field-background shadow-2xl shadow-black/30"
		>
			<LuSearch size={18} className="text-field-placeholder shrink-0 ml-2" />
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="¿A dónde quieres viajar? Roma, Cancún, Bariloche…"
				className="flex-1 h-11 min-w-0 outline-none text-sm text-field-foreground placeholder:text-field-placeholder bg-transparent"
				aria-label="Buscar destino u oferta"
			/>
			<Button type="submit" color="primary" className="shrink-0 rounded-xl px-5 h-11 font-semibold">
				{({ isPending }) => (isPending ? 'Buscando…' : 'Buscar')}
			</Button>
		</form>
	);

	if (isCarousel) {
		return (
			<>
				<section
					className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] relative overflow-hidden bg-background"
					style={{ height: 'calc(100vh + 68px)', minHeight: '520px' }}
					onMouseEnter={() => setPaused(true)}
					onMouseLeave={() => setPaused(false)}
				>
					{slides.map((novedad, i) => (
						<Image
							key={novedad.id}
							src={novedad.images[0]}
							alt=""
							fill
							priority={i === 0}
							quality={85}
							sizes="100vw"
							onLoad={() => { if (i === 0) { setMediaReady(true); } }}
							className={`object-cover transition-opacity duration-700 ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
						/>
					))}

					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

					{slides.length > 1 && (
						<div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
							{slides.map((novedad, i) => (
								<button
									key={novedad.id}
									type="button"
									onClick={() => setSlideIndex(i)}
									aria-label={`Ver novedad ${i + 1}`}
									className={`h-2 rounded-full transition-all duration-300 ${
										i === slideIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
									}`}
								/>
							))}
						</div>
					)}

					<div
						className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
							!mediaReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
						}`}
					>
						<Spinner size="lg" />
					</div>
				</section>

				<div className="w-screen -mx-[calc((100vw-100%)/2)] bg-surface-secondary px-6 py-6 flex justify-center">
					{searchForm}
				</div>
			</>
		);
	}

	return (
		<section
			className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] relative overflow-hidden bg-background"
			style={{ height: 'calc(100vh + 68px)', minHeight: '640px' }}
		>
			{/* Fondo decorativo — textura sutil sobre el bg sólido */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute -top-1/4 -left-1/4 w-[70%] aspect-square rounded-full bg-white/10 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
				<div className="absolute -bottom-1/3 -right-1/4 w-[65%] aspect-square rounded-full bg-black/15 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" />
			</div>

			{/* Media layer — imagen o video de la DB, se superpone al fondo cuando carga */}
			{media?.type === 'video' ? (
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

			{/* Legibilidad del texto — degradado neutro, sin lavado naranja */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/25 pointer-events-none" />

			{/* Content */}
			<div
				className="relative h-full flex flex-col items-center justify-center px-6 pt-[68px]"
				style={{
					opacity: textIn ? 1 : 0,
					transform: textIn ? 'translateY(0)' : 'translateY(20px)',
					transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
				}}
			>
				<h1
					className="text-center text-white leading-[1.05] mb-4 font-extrabold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]"
					style={{ fontSize: 'clamp(2.75rem, 6.5vw, 5.5rem)' }}
				>
					A cada destino,
					<br />
					<span className="text-accent">le sobra un motivo.</span>
				</h1>

				<p className="text-center text-white/90 mb-10 max-w-md text-[15px] leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
					Busca tu próximo viaje entre paquetes armados a medida, con asesoría experta y precios que no encontrarás en ningún portal.
				</p>

				{searchForm}
			</div>

			{/* Loader — capa opaca de tope, tapa todo hasta que la sección está lista */}
			<div
				className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
					heroLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
				}`}
			>
				<Spinner size="lg" />
			</div>
		</section>
	);
}
