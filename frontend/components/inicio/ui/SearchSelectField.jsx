'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SearchSelectField({ label, icon, value, options, onChange }) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(e) {
			if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const selected = options.find((o) => o.value === value);

	return (
		<div ref={containerRef} className="relative min-w-0">
			<span className="text-[10px] uppercase tracking-widest text-muted font-semibold block mb-2 ml-0.5">{label}</span>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="h-12 w-full rounded-xl border border-default bg-surface-secondary px-3.5 flex items-center gap-2.5 text-left hover:border-accent/40 active:scale-[0.98] transition-[border-color,transform] duration-150"
			>
				<span className="text-accent shrink-0">{icon}</span>
				<span className="flex-1 min-w-0 text-sm font-semibold truncate">{selected?.label ?? 'Seleccionar'}</span>
				<ChevronDown
					size={15}
					className="shrink-0 text-muted transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]"
					style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
				/>
			</button>

			{open && (
				<ul className="animate-dropdown-in absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-default bg-surface shadow-xl py-1 origin-top">
					{options.map((option) => (
						<li key={option.value}>
							<button
								type="button"
								onMouseDown={() => { onChange(option.value); setOpen(false); }}
								className={`w-full px-3.5 py-2 text-sm text-left hover:bg-surface-secondary transition-colors duration-150 ${option.value === value ? 'font-semibold text-accent' : ''}`}
							>
								{option.label}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
