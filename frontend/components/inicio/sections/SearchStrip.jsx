'use client';

import HeroSearchWidget from '@/components/inicio/ui/HeroSearchWidget';

export default function SearchStrip() {
	return (
		<div className="relative space-y-6">
			<h1 className="font-extrabold leading-[1.05] tracking-tight text-foreground" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.25rem)' }}>
				¿A dónde te llevamos <span className="text-brand-primary">esta vez</span>?
			</h1>

			<HeroSearchWidget />
		</div>
	);
}
