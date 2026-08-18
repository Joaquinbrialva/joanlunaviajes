'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, NumberField } from '@heroui/react';
import { Minus, Plus } from 'lucide-react';
import HeroSelect from '@/components/ui/hero-select';
import DatePickerField from '@/components/ui/date-picker-field';

const FIELD_LABEL_CLASS = 'text-[10px] uppercase tracking-widest text-muted font-semibold block mb-1.5 ml-0.5';
const SELECT_TRIGGER_CLASS = 'h-11 rounded-xl border border-default bg-surface px-3 text-sm';
const DATE_TRIGGER_CLASS = 'h-11 px-3 rounded-xl border border-default w-full flex items-center gap-2 text-sm text-left hover:bg-surface-secondary transition-colors';
const ANY_DEST = 'all';

export default function HeroSearchWidget() {
	const [countries, setCountries] = useState([]);
	const [destino, setDestino] = useState(ANY_DEST);
	const [fecha, setFecha] = useState('');
	const [personas, setPersonas] = useState(1);
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

	const destinoOptions = [
		{ value: ANY_DEST, label: 'Cualquier destino' },
		...countries.map((c) => ({ value: c, label: c })),
	];

	function handleSubmit(e) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (destino && destino !== ANY_DEST) params.set('dest', destino);
		if (fecha) params.set('date', fecha);
		params.set('pax', String(personas));
		router.push(`/ofertas?${params.toString()}`);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full max-w-3xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-3 rounded-2xl bg-surface border border-default shadow-2xl shadow-black/20"
		>
			<div className="flex-1 min-w-0">
				<label className={FIELD_LABEL_CLASS}>Destino</label>
				<HeroSelect
					value={destino}
					onValueChange={setDestino}
					options={destinoOptions}
					triggerClassName={SELECT_TRIGGER_CLASS}
					ariaLabel="Destino"
				/>
			</div>

			<div className="flex-1 min-w-0">
				<label className={FIELD_LABEL_CLASS}>Fecha</label>
				<DatePickerField
					value={fecha}
					onChange={setFecha}
					placeholder="Cualquier fecha"
					triggerClassName={DATE_TRIGGER_CLASS}
				/>
			</div>

			<div className="sm:w-36">
				<label className={FIELD_LABEL_CLASS}>Personas</label>
				<NumberField
					value={personas}
					onChange={(v) => setPersonas(isNaN(v) ? 1 : Math.max(1, v))}
					minValue={1}
					formatOptions={{ maximumFractionDigits: 0, useGrouping: false }}
					aria-label="Cantidad de personas"
				>
					<NumberField.Group className="h-11 rounded-xl border border-default flex items-center overflow-hidden bg-surface w-full">
						<NumberField.DecrementButton className="h-full px-3 hover:bg-surface-secondary border-r border-default flex items-center text-muted hover:text-foreground transition-colors">
							<Minus size={13} />
						</NumberField.DecrementButton>
						<NumberField.Input className="flex-1 h-full px-2 bg-transparent text-sm outline-none text-center font-semibold" />
						<NumberField.IncrementButton className="h-full px-3 hover:bg-surface-secondary border-l border-default flex items-center text-muted hover:text-foreground transition-colors">
							<Plus size={13} />
						</NumberField.IncrementButton>
					</NumberField.Group>
				</NumberField>
			</div>

			<Button type="submit" color="primary" className="shrink-0 rounded-xl px-6 h-11 font-semibold">
				{({ isPending }) => (isPending ? 'Buscando…' : 'Buscar')}
			</Button>
		</form>
	);
}
