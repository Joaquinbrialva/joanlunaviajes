'use client';

import { Checkbox, Description, Fieldset, NumberField } from '@heroui/react';
import { Check, Minus, Plus } from 'lucide-react';

/* Shared primitives for the admin offer/destination wizards.
   Extracted from ofertas/nueva, ofertas/[slug]/editar, destinos/nuevo,
   destinos/[slug]/editar — previously copy-pasted verbatim in all four. */

export function StepperBar({ pasos, paso, maxStep = Infinity, onGoToStep }) {
  return (
    <div className='flex items-start gap-0'>
      {pasos.map((step, i) => {
        const active = step.id === paso;
        const done = step.id < paso;
        const locked = step.id > maxStep;
        return (
          <div key={step.id} className='flex items-start flex-1 min-w-0'>
            <div className='flex flex-col items-center min-w-0 flex-1'>
              <button
                type='button'
                onClick={() => !locked && onGoToStep(step.id)}
                disabled={locked}
                className='flex flex-col items-center gap-2 group disabled:cursor-not-allowed'
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${active
                  ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25 scale-110'
                  : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-secondary border-2 border-default text-muted/50'
                  }`}>
                  {done ? <Check size={15} strokeWidth={2.5} /> : step.id}
                </div>
                <span className={`text-[10px] uppercase tracking-[0.12em] font-bold whitespace-nowrap transition-colors ${active ? 'text-accent' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted/60'
                  }`}>
                  {step.label}
                </span>
              </button>
            </div>
            {i < pasos.length - 1 && (
              <div className='flex-1 flex items-start pt-[18px] px-1'>
                <div className={`h-[2px] w-full rounded-full transition-colors duration-300 ${paso > step.id ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-border'
                  }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FieldGroup({ title, children, className = '' }) {
  return (
    <Fieldset className={`border-t border-default/70 pt-5 ${className}`}>
      {title && (
        <Fieldset.Legend className='text-[10px] uppercase tracking-[0.2em] font-bold text-muted/70'>{title}</Fieldset.Legend>
      )}
      <Fieldset.Group>{children}</Fieldset.Group>
    </Fieldset>
  );
}

export function FL({ children }) {
  return <span className='text-[10px] uppercase tracking-[0.15em] font-semibold text-muted block mb-1.5'>{children}</span>;
}

export function FInput({ error, className = '', ...props }) {
  return (
    <input
      className={`h-11 px-3.5 rounded-xl border w-full text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/60 transition-all ${error ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-default hover:border-muted/50'
        } ${className}`}
      {...props}
    />
  );
}

export function FError({ children }) {
  if (!children) return null;
  return <p className='text-xs text-rose-500 mt-1 flex items-center gap-1'>⚠ {children}</p>;
}

export function NumField({ label, value, onChange, min = 0, withButtons = false, formatOptions }) {
  return (
    <div className='space-y-1.5'>
      <FL>{label}</FL>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        formatOptions={formatOptions ?? { maximumFractionDigits: 0, useGrouping: false }}
        className='w-full'
      >
        <NumberField.Group className='h-11 rounded-xl border border-default flex items-center overflow-hidden bg-surface hover:border-muted/50 transition-colors'>
          {withButtons && (
            <NumberField.DecrementButton className='h-full px-3 hover:bg-surface-secondary border-r border-default transition-colors flex items-center text-muted'>
              <Minus size={13} />
            </NumberField.DecrementButton>
          )}
          <NumberField.Input className='flex-1 h-full px-3.5 bg-transparent text-sm outline-none min-w-0 text-center' />
          {withButtons && (
            <NumberField.IncrementButton className='h-full px-3 hover:bg-surface-secondary border-l border-default transition-colors flex items-center text-muted'>
              <Plus size={13} />
            </NumberField.IncrementButton>
          )}
        </NumberField.Group>
      </NumberField>
    </div>
  );
}

export function PillToggle({ options, value, onChange }) {
  return (
    <div className='flex flex-wrap gap-2'>
      {options.map((op) => (
        <button
          key={op.value}
          type='button'
          onClick={() => onChange(op.value)}
          className={`h-9 px-4 rounded-full text-sm font-semibold border transition-all duration-150 ${value === op.value
            ? 'bg-accent text-accent-foreground border-accent shadow-sm shadow-accent/20'
            : 'bg-surface border-default text-muted hover:border-accent/40 hover:text-foreground'
            }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

export function LuggageChip({ label, checked, onChange }) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className={`h-8 px-4 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 ${checked
        ? 'bg-accent/10 text-accent border-accent/30'
        : 'bg-surface border-default text-muted hover:border-accent/30'
        }`}
    >
      {checked && <Check size={11} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

export function CheckPill({ label, checked, onChange, note }) {
  return (
    <div>
      <Checkbox isSelected={checked} onChange={onChange}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <span className='text-sm font-medium'>{label}</span>
        </Checkbox.Content>
      </Checkbox>
      {note && <Description>{note}</Description>}
    </div>
  );
}

export function ReviewRow({ label, value }) {
  return (
    <div className='flex gap-4 py-2.5 px-4 border-b border-default/50 last:border-0'>
      <span className='text-[11px] uppercase tracking-[0.1em] font-semibold text-muted w-28 shrink-0 pt-0.5'>{label}</span>
      <span className='flex-1 text-sm font-medium text-foreground'>{value}</span>
    </div>
  );
}

export function StarSelector({ value, onChange }) {
  return (
    <div className='flex items-center gap-0.5 h-11 px-1'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          onClick={() => onChange(value === n ? 0 : n)}
          className={`text-[22px] leading-none transition-colors duration-150 px-0.5 ${n <= value ? 'text-amber-400' : 'text-muted/20 hover:text-amber-300'}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className='text-xs text-muted ml-1.5'>{value} estrella{value !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}
