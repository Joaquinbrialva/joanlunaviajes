'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function pad(n) { return String(n).padStart(2, '0'); }
function toISO(year, month, day) { return `${year}-${pad(month + 1)}-${pad(day)}`; }
function addMonths(year, month, delta) {
	const d = new Date(year, month + delta, 1);
	return { year: d.getFullYear(), month: d.getMonth() };
}

function buildMonthCells(year, month) {
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const leading = (new Date(year, month, 1).getDay() + 6) % 7;
	const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;
	const cells = [];
	for (let i = 0; i < totalCells; i++) {
		const day = i - leading + 1;
		cells.push(day >= 1 && day <= daysInMonth ? { day, iso: toISO(year, month, day) } : null);
	}
	return cells;
}

function MonthJumpPanel({ year, month, onPick, onClose }) {
	const [jumpYear, setJumpYear] = useState(year);
	return (
		<div className="animate-dropdown-in absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 rounded-xl border border-default bg-surface shadow-xl p-3 origin-bottom">
			<div className="flex items-center justify-between mb-2 px-1">
				<button type="button" onClick={() => setJumpYear((y) => y - 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:bg-surface-secondary transition-colors">
					<ChevronLeft size={14} />
				</button>
				<span className="text-sm font-bold">{jumpYear}</span>
				<button type="button" onClick={() => setJumpYear((y) => y + 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:bg-surface-secondary transition-colors">
					<ChevronRight size={14} />
				</button>
			</div>
			<div className="grid grid-cols-3 gap-1.5">
				{MONTH_NAMES.map((name, i) => (
					<button
						key={name}
						type="button"
						onClick={() => { onPick(jumpYear, i); onClose(); }}
						className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
							jumpYear === year && i === month ? 'bg-accent text-accent-foreground' : 'hover:bg-surface-secondary text-foreground'
						}`}
					>
						{name.slice(0, 3)}
					</button>
				))}
			</div>
		</div>
	);
}

function MonthGrid({ year, month, start, end, jumpOpenKey, jumpKey, onToggleJump, onPickMonth, onSelectDay }) {
	const cells = buildMonthCells(year, month);
	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => onToggleJump(jumpKey)}
				className="flex items-center gap-1.5 mb-2 px-1.5 py-1 rounded-lg hover:bg-surface-secondary transition-colors"
			>
				<span className="text-sm font-bold">{MONTH_NAMES[month]} {year}</span>
				<ChevronDown size={13} className="text-muted" />
			</button>

			{jumpOpenKey === jumpKey && (
				<MonthJumpPanel year={year} month={month} onPick={onPickMonth} onClose={() => onToggleJump(null)} />
			)}

			<div className="grid grid-cols-7 gap-y-0.5 mb-1">
				{WEEKDAYS.map((w, i) => (
					<div key={i} className="w-9 text-center text-[10px] font-bold tracking-wide text-muted">{w}</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-y-0.5">
				{cells.map((cell, i) => {
					if (!cell) return <div key={i} className="w-9 h-9" />;
					const isStart = cell.iso === start;
					const isEnd = cell.iso === end;
					const inRange = start && end && cell.iso > start && cell.iso < end;
					const isEndpoint = isStart || isEnd;
					return (
						<div key={i} className="relative w-9 h-9 flex items-center justify-center">
							{inRange && <span className="absolute inset-y-0 -inset-x-px bg-accent/15" />}
							{isStart && end && <span className="absolute inset-y-0 right-0 w-1/2 bg-accent/15" />}
							{isEnd && start && <span className="absolute inset-y-0 left-0 w-1/2 bg-accent/15" />}
							<button
								type="button"
								onClick={() => onSelectDay(cell.iso)}
								className={`relative z-10 w-9 h-9 rounded-full text-sm font-medium transition-colors ${
									isEndpoint ? 'bg-accent text-accent-foreground font-bold' : 'hover:bg-surface-secondary text-foreground'
								}`}
							>
								{cell.day}
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function DualMonthCalendar({ mode = 'range', start, end, onSelectDay, onNavigate, anchorYear, anchorMonth }) {
	const [jumpOpen, setJumpOpen] = useState(null);
	const next = addMonths(anchorYear, anchorMonth, 1);

	function handlePickMonth(year, month) {
		onNavigate(year, month);
	}

	function goPrev() {
		const { year, month } = addMonths(anchorYear, anchorMonth, -1);
		onNavigate(year, month);
	}
	function goNext() {
		const { year, month } = addMonths(anchorYear, anchorMonth, 1);
		onNavigate(year, month);
	}

	return (
		<div className="w-full">
			<div className="flex items-center justify-between mb-1">
				<button type="button" onClick={goPrev} aria-label="Mes anterior" className="w-8 h-8 rounded-full border border-default bg-surface-secondary text-muted flex items-center justify-center hover:text-foreground transition-colors">
					<ChevronLeft size={14} />
				</button>
				<div />
				<button type="button" onClick={goNext} aria-label="Mes siguiente" className="w-8 h-8 rounded-full border border-default bg-surface-secondary text-muted flex items-center justify-center hover:text-foreground transition-colors">
					<ChevronRight size={14} />
				</button>
			</div>

			<div className="flex gap-5">
				<MonthGrid
					year={anchorYear}
					month={anchorMonth}
					start={start}
					end={mode === 'range' ? end : undefined}
					jumpOpenKey={jumpOpen}
					jumpKey="left"
					onToggleJump={(k) => setJumpOpen((cur) => (cur === k ? null : k))}
					onPickMonth={handlePickMonth}
					onSelectDay={onSelectDay}
				/>
				<MonthGrid
					year={next.year}
					month={next.month}
					start={start}
					end={mode === 'range' ? end : undefined}
					jumpOpenKey={jumpOpen}
					jumpKey="right"
					onToggleJump={(k) => setJumpOpen((cur) => (cur === k ? null : k))}
					onPickMonth={(y, m) => handlePickMonth(...Object.values(addMonths(y, m, -1)))}
					onSelectDay={onSelectDay}
				/>
			</div>
		</div>
	);
}
