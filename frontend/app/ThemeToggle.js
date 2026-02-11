'use client';

import { Button } from '@heroui/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();

	if (!resolvedTheme) return null;

	const isDark = resolvedTheme === 'dark';

	return (
		<Button
			variant='outline'
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className='relative h-10 w-10 p-0 transition-colors'
		>
			<Sun
				className={`
          absolute transition-all duration-300
          ${isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}
        `}
				size={18}
			/>

			<Moon
				className={`
          absolute transition-all duration-300
          ${isDark ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}
        `}
				size={18}
			/>
		</Button>
	);
}
