'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, PlaneLanding, PlaneTakeoff, Search } from 'lucide-react';
import SearchSelectField from '@/components/inicio/ui/SearchSelectField';
import DateRangeField from '@/components/inicio/ui/DateRangeField';
import PassengerPopover, { DEFAULT_PAX } from '@/components/inicio/ui/PassengerPopover';

const DATE_TRIGGER_CLASS = 'h-12 px-3.5 rounded-xl border border-default bg-surface-secondary w-full flex items-center gap-2.5 text-left hover:border-accent/40 transition-colors';
const ANY = 'all';

export default function HeroSearchWidget({ loading = false }) {
	const [countries, setCountries] = useState([]);
	const [tripType, setTripType] = useState('roundtrip');
	const [origen, setOrigen] = useState(ANY);
	const [destino, setDestino] = useState(ANY);
	const [fechaIda, setFechaIda] = useState('');
	const [fechaVuelta, setFechaVuelta] = useState('');
	const [pax, setPax] = useState(DEFAULT_PAX);
	const [swapSpins, setSwapSpins] = useState(0);
	const router = useRouter();

	useEffect(() => {
		fetch('/api/ofertas')
			.then((r) => r.json())
			.then((data) => {
				if (!Array.isArray(data)) return;
				const unique = new Set(data.map((o) => o.location?.country).filter(Boolean));
				setCountries([...unique].sort());
			})
			.catch(() => {});
	}, []);

	const originOptions = [{ value: ANY, label: 'Cualquier origen' }, ...countries.map((c) => ({ value: c, label: c }))];
	const destinoOptions = [{ value: ANY, label: 'Cualquier destino' }, ...countries.map((c) => ({ value: c, label: c }))];

	function swapOrigenDestino() {
		setOrigen(destino);
		setDestino(origen);
		setSwapSpins((s) => s + 1);
	}

	function handleSubmit(e) {
		e.preventDefault();
		const params = new URLSearchParams();
		params.set('tripType', tripType);
		if (origen !== ANY) params.set('origin', origen);
		if (destino !== ANY) params.set('dest', destino);
		if (fechaIda) params.set('date', fechaIda);
		if (tripType === 'roundtrip' && fechaVuelta) params.set('dateReturn', fechaVuelta);
		params.set('adultos', String(pax.adultos));
		params.set('adolescentes', String(pax.adolescentes));
		params.set('ninos', String(pax.ninos));
		params.set('infantes', String(pax.infantes));
		router.push(`/ofertas?${params.toString()}`);
	}

	if (loading) {
		return (
			<div className="search-widget w-full flex flex-col gap-3 rounded-2xl border border-default bg-surface p-5 [filter:drop-shadow(0_20px_40px_rgb(0_0_0/0.25))]">
				<div className="h-8 w-52 rounded-lg bg-surface-secondary animate-pulse" />
				<div className="grid grid-cols-1 md:grid-cols-6 gap-3">
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<div key={i} className="h-12 rounded-xl bg-surface-secondary animate-pulse" />
					))}
				</div>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="search-widget animate-slide-up w-full flex flex-col gap-4 rounded-2xl border border-default bg-surface p-5 [filter:drop-shadow(0_20px_40px_rgb(0_0_0/0.25))]"
		>
			<div className="relative inline-grid grid-cols-2 self-start rounded-xl bg-surface-secondary p-1 gap-1">
				<span
					aria-hidden="true"
					className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-accent transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
					style={{ transform: tripType === 'oneway' ? 'translateX(calc(100% + 0.25rem))' : 'translateX(0)' }}
				/>
				{[
					{ id: 'roundtrip', label: 'Ida y vuelta' },
					{ id: 'oneway', label: 'Solo ida' },
				].map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTripType(t.id)}
						className={`relative z-10 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
							tripType === t.id ? 'text-accent-foreground' : 'text-muted hover:text-foreground'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[1.3fr_auto_1.3fr_1.3fr_1.15fr_auto] items-end gap-3">
				<SearchSelectField
					label="Origen"
					icon={<PlaneTakeoff size={16} />}
					value={origen}
					options={originOptions}
					onChange={setOrigen}
				/>

				<div className="hidden md:flex justify-center pb-1">
					<button
						type="button"
						onClick={swapOrigenDestino}
						aria-label="Intercambiar origen y destino"
						className="w-9 h-9 rounded-full border border-default bg-surface-secondary text-muted flex items-center justify-center hover:text-accent hover:border-accent/40 active:scale-90 transition-[color,border-color,transform] duration-200"
					>
						<ArrowLeftRight
							size={15}
							className="transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
							style={{ transform: `rotate(${swapSpins * 180}deg)` }}
						/>
					</button>
				</div>

				<SearchSelectField
					label="Destino"
					icon={<PlaneLanding size={16} />}
					value={destino}
					options={destinoOptions}
					onChange={setDestino}
				/>

				<DateRangeField
					label={tripType === 'roundtrip' ? 'Fechas de viaje' : 'Fecha ida'}
					mode={tripType === 'roundtrip' ? 'range' : 'single'}
					start={fechaIda}
					end={fechaVuelta}
					onApply={(start, end) => { setFechaIda(start || ''); setFechaVuelta(end || ''); }}
					triggerClassName={DATE_TRIGGER_CLASS}
				/>

				<PassengerPopover value={pax} onChange={setPax} />

				<button
					type="submit"
					className="h-12 px-8 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.97] transition-[filter,transform] duration-150"
				>
					<Search size={16} />
					Buscar
				</button>
			</div>
		</form>
	);
}
