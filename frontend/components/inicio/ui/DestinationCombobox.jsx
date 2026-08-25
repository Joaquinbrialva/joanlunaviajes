'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function DestinationCombobox({ label, icon, value, options, onChange, placeholder = 'Buscar destino...' }) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	const selected = options.find((o) => o.value === value);

	useEffect(() => {
		function handleClickOutside(e) {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setOpen(false);
				setQuery('');
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const filtered = query.trim() === ''
		? options
		: options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

	function select(option) {
		onChange(option.value);
		setQuery('');
		setOpen(false);
	}

	function handleClear(e) {
		e.stopPropagation();
		onChange('');
		setQuery('');
	}

	return (
		<div ref={containerRef} className="relative min-w-0">
			<label className="text-[10px] uppercase tracking-widest text-muted font-semibold block mb-2 ml-0.5">{label}</label>
			<div className="relative">
				<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent pointer-events-none z-10">{icon}</span>
				<input
					type="text"
					value={open ? query : (selected?.label ?? '')}
					onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
					onFocus={() => { setQuery(''); setOpen(true); }}
					placeholder={placeholder}
					className="h-12 w-full rounded-xl border border-border bg-field-background pl-10 pr-8 text-sm font-semibold text-foreground placeholder:text-muted placeholder:font-normal outline-none focus:border-accent/50 transition-colors"
				/>
				{value && !open && (
					<button
						type="button"
						onClick={handleClear}
						aria-label={`Limpiar ${label.toLowerCase()}`}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
					>
						<X size={13} />
					</button>
				)}
			</div>

			{open && (
				<ul className="animate-dropdown-in absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-default bg-surface shadow-xl py-1 origin-top">
					{filtered.length > 0 ? filtered.map((option) => (
						<li key={option.value || 'any'}>
							<button
								type="button"
								onMouseDown={() => select(option)}
								className={`w-full px-3.5 py-2 text-sm text-left hover:bg-surface-secondary transition-colors duration-150 ${option.value === value ? 'font-semibold text-accent' : ''}`}
							>
								{option.label}
							</button>
						</li>
					)) : (
						<li className="px-3.5 py-2 text-sm text-muted">Sin resultados</li>
					)}
				</ul>
			)}
		</div>
	);
}
