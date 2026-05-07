'use client';
import Destinies from '@/components/inicio/sections/Destinations';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';
import WhyChoose from '@/components/inicio/sections/WhyChoose';

export default function Home() {
	return (
		<>
			<Hero />
			<div className="pt-20 sm:pt-28 space-y-24">
				<Offers />
				<Destinies />
				<WhyChoose />
			</div>
		</>
	);
}
