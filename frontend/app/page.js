'use client';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';
import Destinations from '@/components/inicio/sections/Destinations';
import HowItWorks from '@/components/inicio/sections/HowItWorks';
import QuoteCTA from '@/components/inicio/sections/QuoteCTA';

export default function Home() {
	return (
		<>
			<Hero />
			<div className="pt-20 sm:pt-28 space-y-24">
				<Offers />
				<Destinations />
				<HowItWorks />
				<QuoteCTA />
			</div>
		</>
	);
}
