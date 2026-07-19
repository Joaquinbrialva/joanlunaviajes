'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { LuArrowRight, LuMapPin, LuSearch } from 'react-icons/lu';

const DEFAULT_MEDIA = { type: 'image', url: '/assets/images/hero-img.jpg', poster: null };

export default function Hero() {
	const [media, setMedia] = useState(null);
	const [mediaReady, setMediaReady] = useState(false);
	const [textIn, setTextIn] = useState(false);
	const [query, setQuery] = useState('');
	const videoRef = useRef(null);
	const router = useRouter();

	useEffect(() => {
		fetch('/api/settings/hero')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => setMedia(data?.url ? data : DEFAULT_MEDIA))
			.catch(() => setMedia(DEFAULT_MEDIA));
	}, []);

	useEffect(() => {
		if (mediaReady) {
			const t = setTimeout(() => setTextIn(true), 150);
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

	function handleSearch(e) {
		e.preventDefault();
		const trimmed = query.trim();
		router.push(trimmed ? `/ofertas?q=${encodeURIComponent(trimmed)}` : '/ofertas');
	}

	if (!media) {
		return (
			<section
				className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] bg-brand-primary"
				style={{ height: 'calc(100vh + 68px)', minHeight: '640px' }}
			/>
		);
	}

	return (
		<section
			className="w-screen -mx-[calc((100vw-100%)/2)] -mt-[68px] relative overflow-hidden bg-brand-primary"
			style={{ height: 'calc(100vh + 68px)', minHeight: '640px' }}
		>
			{/* Media layer — desaturated toward brand orange so the naranja de marca carries ~40% of this section */}
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
					onLoadedData={() => setMediaReady(true)}
					className={`absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-70 transition-opacity duration-700 ${mediaReady ? 'opacity-70' : 'opacity-0'}`}
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
					onLoad={() => setMediaReady(true)}
					className={`object-cover mix-blend-luminosity transition-opacity duration-700 ${mediaReady ? 'opacity-70' : 'opacity-0'}`}
					style={media.focalPoint ? { objectPosition: `${media.focalPoint.x}% ${media.focalPoint.y}%` } : undefined}
				/>
			)}

			{/* Brand wash — naranja de marca protagonista, no decorativo */}
			<div className="absolute inset-0 bg-gradient-to-t from-[#7a2d0e] via-brand-primary/60 to-brand-primary/85 mix-blend-multiply pointer-events-none" />
			<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 pointer-events-none" />

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
					className="text-center text-white leading-[1.05] mb-4 font-extrabold tracking-tight"
					style={{ fontSize: 'clamp(2.75rem, 6.5vw, 5.5rem)' }}
				>
					A cada destino,
					<br />
					<span className="text-[#12243b]">le sobra un motivo.</span>
				</h1>

				<p className="text-center text-white/85 mb-10 max-w-md text-[15px] leading-relaxed">
					Busca tu próximo viaje entre paquetes armados a medida, con asesoría experta y precios que no encontrarás en ningún portal.
				</p>

				{/* Buscador — acción primaria */}
				<form
					onSubmit={handleSearch}
					className="w-full max-w-xl flex items-center gap-2 p-2 rounded-2xl bg-white shadow-2xl shadow-black/30"
				>
					<LuSearch size={18} className="text-muted shrink-0 ml-2" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="¿A dónde quieres viajar? Roma, Cancún, Bariloche…"
						className="flex-1 h-11 min-w-0 outline-none text-sm text-foreground placeholder:text-muted bg-transparent"
						aria-label="Buscar destino u oferta"
					/>
					<Button type="submit" color="primary" className="shrink-0 rounded-xl px-5 h-11 font-semibold">
						{({ isPending }) => (isPending ? 'Buscando…' : 'Buscar')}
					</Button>
				</form>

				<button
					type="button"
					onClick={() => router.push('/destinos')}
					className="mt-6 inline-flex items-center gap-1.5 text-white/75 hover:text-white transition-colors text-[13px] font-medium"
				>
					<LuMapPin size={13} />
					o explora destinos por continente
					<LuArrowRight size={13} />
				</button>
			</div>
		</section>
	);
}
