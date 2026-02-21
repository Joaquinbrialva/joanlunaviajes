'use client';
import Destinies from '@/components/inicio/sections/Destinations';
import Footer from '@/components/inicio/sections/Footer';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';
import WhyChoose from '@/components/inicio/sections/WhyChoose';

export default function Home() {
	return (
		<div className='space-y-15'>
			<Hero />
			<Offers />
			<Destinies />
			<WhyChoose />
			<Footer />
		</div>
	);
}
