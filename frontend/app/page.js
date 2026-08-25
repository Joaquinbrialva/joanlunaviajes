'use client';
import SearchStrip from '@/components/inicio/sections/SearchStrip';
import Novedades from '@/components/inicio/sections/Novedades';
import Offers from '@/components/inicio/sections/Offers';
import Destinations from '@/components/inicio/sections/Destinations';
import HowItWorks from '@/components/inicio/sections/HowItWorks';
import QuoteCTA from '@/components/inicio/sections/QuoteCTA';
import Reveal from '@/components/ui/reveal';

export default function Home() {
	return (
		<div className="pt-6 sm:pt-8 pb-16 sm:pb-20 space-y-16 sm:space-y-20">
			<Novedades />
			<SearchStrip />
			<Reveal><Offers /></Reveal>
			<Reveal><Destinations /></Reveal>
			<Reveal><HowItWorks /></Reveal>
			<Reveal><QuoteCTA /></Reveal>
		</div>
	);
}
