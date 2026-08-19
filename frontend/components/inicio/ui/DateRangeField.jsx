'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import DualMonthCalendar from '@/components/inicio/ui/DualMonthCalendar';

const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatShort(iso) {
	if (!iso) return null;
	const [y, m, d] = iso.split('-').map(Number);
	return `${d} ${MONTH_SHORT[m - 1]}`;
}

function nightsBetween(start, end) {
	const a = new Date(`${start}T00:00:00`);
	const b = new Date(`${end}T00:00:00`);
	return Math.round((b - a) / 86400000);
}

export default function DateRangeField({ label, mode, start, end, onApply, triggerClassName }) {
	const [open, setOpen] = useState(false);
	const [draftStart, setDraftStart] = useState(start || null);
	const [draftEnd, setDraftEnd] = useState(end || null);
	const containerRef = useRef(null);

	const today = new Date();
	const initialAnchor = start ? { y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 } : { y: today.getFullYear(), m: today.getMonth() };
	const [anchorYear, setAnchorYear] = useState(initialAnchor.y);
	const [anchorMonth, setAnchorMonth] = useState(initialAnchor.m);

	useEffect(() => {
		function handleClickOutside(e) {
			if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	function toggleOpen() {
		setOpen((o) => {
			if (!o) { setDraftStart(start || null); setDraftEnd(end || null); }
			return !o;
		});
	}

	function handleSelectDay(iso) {
		if (mode === 'single') {
			onApply(iso, null);
			setOpen(false);
			return;
		}
		if (!draftStart || (draftStart && draftEnd)) {
			setDraftStart(iso);
			setDraftEnd(null);
		} else if (iso < draftStart) {
			setDraftStart(iso);
			setDraftEnd(null);
		} else {
			setDraftEnd(iso);
		}
	}

	function handleApply() {
		onApply(draftStart, draftEnd);
		setOpen(false);
	}

	const summary = mode === 'single'
		? (start ? formatShort(start) : 'Cualquier fecha')
		: (start && end ? `${formatShort(start)} — ${formatShort(end)}` : start ? formatShort(start) : 'Cualquier fecha');

	return (
		<div ref={containerRef} className="relative min-w-0">
			<label className="text-[10px] uppercase tracking-widest text-muted font-semibold block mb-2 ml-0.5">{label}</label>
			<button
				type="button"
				onClick={toggleOpen}
				className={triggerClassName}
			>
				<CalendarIcon size={16} className="text-muted shrink-0" />
				<span className="flex-1 min-w-0 text-sm font-semibold truncate">{summary}</span>
			</button>

			{open && (
				<div className="animate-dropdown-in absolute z-50 mt-1.5 rounded-xl border border-default bg-surface shadow-xl p-4 origin-top left-1/2 -translate-x-1/2 w-max max-w-[90vw]">
					<DualMonthCalendar
						mode={mode}
						start={draftStart}
						end={draftEnd}
						anchorYear={anchorYear}
						anchorMonth={anchorMonth}
						onNavigate={(y, m) => { setAnchorYear(y); setAnchorMonth(m); }}
						onSelectDay={handleSelectDay}
					/>

					{mode === 'range' && (
						<div className="flex items-center justify-between mt-3 pt-3 border-t border-default">
							<span className="text-xs text-muted">
								{draftStart && draftEnd ? (
									<><span className="text-foreground font-semibold">{formatShort(draftStart)}</span> — <span className="text-foreground font-semibold">{formatShort(draftEnd)}</span> · {nightsBetween(draftStart, draftEnd)} noches</>
								) : draftStart ? (
									<>Elegí la fecha de vuelta</>
								) : (
									<>Elegí la fecha de ida</>
								)}
							</span>
							<button
								type="button"
								onClick={handleApply}
								disabled={!draftStart}
								className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-bold hover:brightness-105 active:scale-[0.97] transition-[filter,transform] duration-150 disabled:opacity-40 disabled:pointer-events-none"
							>
								Aplicar
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
