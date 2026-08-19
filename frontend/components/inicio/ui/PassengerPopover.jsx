'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Users } from 'lucide-react';

export const DEFAULT_PAX = { adultos: 1, adolescentes: 0, ninos: 0, infantes: 0 };

const PAX_FIELDS = [
	{ key: 'adultos', label: 'Adultos', hint: '18 años o más', min: 1 },
	{ key: 'adolescentes', label: 'Adolescentes', hint: '13 a 17 años', min: 0 },
	{ key: 'ninos', label: 'Niños', hint: '2 a 12 años', min: 0 },
	{ key: 'infantes', label: 'Infantes', hint: '0 a 23 meses', min: 0 },
];

function Stepper({ value, min, onChange }) {
	const atMin = value <= min;
	return (
		<div className="flex items-center gap-3.5 shrink-0">
			<button
				type="button"
				disabled={atMin}
				onClick={() => onChange(value - 1)}
				className="w-8 h-8 rounded-full border border-default bg-surface-secondary flex items-center justify-center text-muted hover:border-accent/40 hover:text-foreground active:scale-90 transition-[color,border-color,transform] duration-150 disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
			>
				<Minus size={13} />
			</button>
			<span key={value} className="w-4 text-center text-sm font-bold animate-dropdown-in">{value}</span>
			<button
				type="button"
				onClick={() => onChange(value + 1)}
				className="w-8 h-8 rounded-full border border-accent bg-accent text-accent-foreground flex items-center justify-center hover:brightness-105 active:scale-90 transition-[filter,transform] duration-150"
			>
				<Plus size={13} />
			</button>
		</div>
	);
}

export default function PassengerPopover({ value, onChange }) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(e) {
			if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const total = value.adultos + value.adolescentes + value.ninos + value.infantes;

	function updateField(key, min, v) {
		onChange({ ...value, [key]: Math.max(min, v) });
	}

	return (
		<div ref={containerRef} className="relative min-w-0">
			<span className="text-[10px] uppercase tracking-widest text-muted font-semibold block mb-2 ml-0.5">Pasajeros</span>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="h-12 w-full rounded-xl border border-default bg-surface-secondary px-3.5 flex items-center gap-2.5 text-left hover:border-accent/40 active:scale-[0.98] transition-[border-color,transform] duration-150"
			>
				<Users size={16} className="text-muted shrink-0" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold truncate">{total} pasajero{total === 1 ? '' : 's'}</p>
					<p className="text-xs text-muted truncate">{value.adultos} adulto{value.adultos === 1 ? '' : 's'}</p>
				</div>
			</button>

			{open && (
				<div className="animate-dropdown-in origin-top-right absolute z-50 mt-1.5 w-80 rounded-xl border border-default bg-surface shadow-xl p-4 right-0">
					{PAX_FIELDS.map(({ key, label, hint, min }, i) => (
						<div
							key={key}
							className={`flex items-center justify-between gap-3 py-3 ${i < PAX_FIELDS.length - 1 ? 'border-b border-default' : ''}`}
						>
							<div>
								<p className="text-sm font-semibold">{label}</p>
								<p className="text-xs text-muted mt-0.5">{hint}</p>
							</div>
							<Stepper value={value[key]} min={min} onChange={(v) => updateField(key, min, v)} />
						</div>
					))}
					<button
						type="button"
						onClick={() => setOpen(false)}
						className="w-full mt-3 h-11 rounded-lg bg-accent text-accent-foreground text-sm font-bold hover:brightness-105 active:scale-[0.98] transition-[filter,transform] duration-150"
					>
						Listo
					</button>
				</div>
			)}
		</div>
	);
}
