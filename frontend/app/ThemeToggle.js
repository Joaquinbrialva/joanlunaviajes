'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) return <div className='h-10 w-10' />;

	const isDark = resolvedTheme === 'dark';

	return (
		<Button
			variant='outline'
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className='relative h-10 w-10 p-0 transition-colors'
		>
			<MdLightMode
				className={`
          absolute transition-all duration-300
          ${isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}
        `}
			/>

			<MdDarkMode
				className={`
          absolute transition-all duration-300
          ${isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}
        `}
			/>
		</Button>
	);
}
