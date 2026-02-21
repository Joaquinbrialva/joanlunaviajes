'use client';
import Hero from '@/components/inicio/sections/Hero';
import Offers from '@/components/inicio/sections/Offers';

export default function Home() {
	return (
		<div className='space-y-4'>
			<Hero />
			<Offers />
		</div>
	);
}
