'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LuChevronLeft, LuChevronRight, LuCompass } from 'react-icons/lu';

const AUTOPLAY_MS = 15000;

function primaryMedia(novedad) {
	if (Array.isArray(novedad.media) && novedad.media.length > 0) return novedad.media[0];
	return { url: novedad.images?.[0], type: 'image' };
}

function relativeTime(dateStr) {
	const d = new Date(dateStr);
	const diffMs = Date.now() - d.getTime();
	const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	if (days <= 0) return 'Hoy';
	if (days === 1) return 'Ayer';
	if (days < 7) return `Hace ${days} días`;
	if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
	return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function NovedadVideo({ item, className, onReady }) {
	const ref = useRef(null);
	const start = item.trimStart || 0;
	const end = item.trimEnd || null;

	function handleTimeUpdate() {
		const v = ref.current;
		if (!v) return;
		if (v.currentTime < start || (end && v.currentTime >= end)) v.currentTime = start;
	}

	const zoom = item.zoom || 1;
	const fp = item.focalPoint || { x: 50, y: 50 };

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
			className={className}
			style={{
				objectPosition: `${fp.x}% ${fp.y}%`,
				transform: zoom > 1 ? `scale(${zoom})` : undefined,
			}}
		/>
	);
}

function Slide({ novedad, isActive }) {
	const item = primaryMedia(novedad);

	return (
		<div className="relative w-full shrink-0" style={{ aspectRatio: '12 / 5' }}>
			{item.type === 'video' ? (
				isActive && <NovedadVideo item={item} className="absolute inset-0 h-full w-full object-contain" />
			) : (
				<Image
					src={item.url}
					alt={novedad.caption || 'Novedad de Joanluna Viajes'}
					fill
					priority={isActive}
					quality={88}
					sizes="(max-width: 768px) 100vw, (max-width: 1440px) 90vw, 1300px"
					className="object-contain"
				/>
			)}

			<span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-surface/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-foreground shadow-sm">
				<span className="h-1.5 w-1.5 rounded-full bg-brand-primary motion-safe:animate-pulse" />
				{relativeTime(novedad.createdAt)}
			</span>
		</div>
	);
}

function Carousel({ novedades, active, onPrev, onNext, showArrows, onSelect }) {
	const count = novedades.length;

	return (
		<div className="relative overflow-hidden rounded-[28px] bg-surface-secondary">
			<div
				className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
				style={{ width: `${count * 100}%`, transform: `translateX(-${active * (100 / count)}%)` }}
			>
				{novedades.map((n, i) => (
					<div key={n.id} style={{ width: `${100 / count}%` }}>
						<Slide novedad={n} isActive={i === active} />
					</div>
				))}
			</div>

			{showArrows && (
				<>
					<button
						type="button"
						onClick={onPrev}
						aria-label="Novedad anterior"
						className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 backdrop-blur-sm text-foreground shadow-sm transition hover:bg-surface hover:scale-105"
					>
						<LuChevronLeft size={20} />
					</button>
					<button
						type="button"
						onClick={onNext}
						aria-label="Siguiente novedad"
						className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 backdrop-blur-sm text-foreground shadow-sm transition hover:bg-surface hover:scale-105"
					>
						<LuChevronRight size={20} />
					</button>
				</>
			)}

			{count > 1 && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
					{novedades.map((n, i) => (
						<button
							key={n.id}
							type="button"
							onClick={() => onSelect(i)}
							aria-label={`Ir a novedad ${i + 1}`}
							aria-current={i === active}
							className={`h-1.5 rounded-full transition-all duration-300 ${
								i === active ? 'w-6 bg-brand-primary' : 'w-1.5 bg-surface/60 hover:bg-surface/80'
							}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function NovedadesSkeleton() {
	return (
		<div className="space-y-5 animate-pulse">
			<div className="w-full rounded-[28px] bg-surface-secondary" style={{ aspectRatio: '12 / 5' }} />
		</div>
	);
}

function EmptyPanel() {
	return (
		<div className="relative overflow-hidden rounded-[28px] border border-dashed border-border py-20 px-6 text-center">
			<div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-brand-secondary/10 blur-3xl pointer-events-none" aria-hidden="true" />
			<div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" aria-hidden="true" />
			<div className="relative flex flex-col items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
					<LuCompass size={22} />
				</div>
				<p className="font-semibold text-foreground">Muy pronto, nuevas novedades</p>
				<p className="text-sm text-muted max-w-xs">Estamos armando el próximo viaje. Volvé pronto para ver las últimas salidas.</p>
			</div>
		</div>
	);
}

export default function Novedades() {
	const [novedades, setNovedades] = useState(null);
	const [active, setActive] = useState(0);

	useEffect(() => {
		fetch('/api/novedades')
			.then((r) => r.json())
			.then((data) => {
				const published = Array.isArray(data)
					? data.filter((u) => u.status === 'published' && (u.media?.length > 0 || u.images?.length > 0))
					: [];
				setNovedades(published);
			})
			.catch(() => setNovedades([]));
	}, []);

	const loading = novedades === null;
	const canCycle = !loading && novedades.length > 1;

	const goNext = useCallback(() => {
		setActive((i) => (novedades && novedades.length > 0 ? (i + 1) % novedades.length : 0));
	}, [novedades]);

	const goPrev = useCallback(() => {
		setActive((i) => (novedades && novedades.length > 0 ? (i - 1 + novedades.length) % novedades.length : 0));
	}, [novedades]);

	useEffect(() => {
		if (!canCycle) return;
		const timer = setInterval(goNext, AUTOPLAY_MS);
		return () => clearInterval(timer);
	}, [canCycle, goNext, active]);

	return (
		<div>
			{loading ? (
				<NovedadesSkeleton />
			) : novedades.length === 0 ? (
				<EmptyPanel />
			) : (
				<Carousel novedades={novedades} active={active} onPrev={goPrev} onNext={goNext} onSelect={setActive} showArrows={canCycle} />
			)}
		</div>
	);
}
