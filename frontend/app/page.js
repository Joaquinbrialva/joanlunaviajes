'use client';
import Destinations from '@/components/inicio/sections/Destinations';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';
import HowItWorks from '@/components/inicio/sections/HowItWorks';
import QuoteCTA from '@/components/inicio/sections/QuoteCTA';

export default function Home() {
	return (
		<>
			<Hero />
			<div className="pt-20 sm:pt-28 space-y-24">
				<Offers />
				<HowItWorks />
				<Destinations />
				<QuoteCTA />
			</div>
		</>
	);
}
