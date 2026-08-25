'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Disclosure, NumberField } from '@heroui/react';
import { Check, ChevronDown, CircleAlert, Minus, Plus } from 'lucide-react';

/* ─── Section shell ──────────────────────────────────────────────────── */

export function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className='rounded-2xl border border-default bg-surface p-5 md:p-6'>
      <div className='mb-5 flex items-start gap-2.5'>
        {Icon && (
          <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent'>
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
        <div>
          <h2 className='text-[14.5px] font-semibold text-foreground'>{title}</h2>
          {description && <p className='mt-0.5 text-xs text-muted'>{description}</p>}
        </div>
      </div>
      <div className='space-y-5'>{children}</div>
    </section>
  );
}

/* Same shell, collapsible — for optional field groups (Alojamiento). */
export function CollapsibleSection({ icon: Icon, title, description, defaultExpanded = false, children }) {
  return (
    <Disclosure defaultExpanded={defaultExpanded} className='rounded-2xl border border-default bg-surface'>
      <Disclosure.Heading>
        <Disclosure.Trigger className='flex w-full items-center justify-between gap-3 p-5 text-left md:p-6'>
          <span className='flex items-start gap-2.5'>
            {Icon && (
              <span className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent'>
                <Icon size={15} strokeWidth={2} />
              </span>
            )}
            <span>
              <span className='block text-[14.5px] font-semibold text-foreground'>{title}</span>
              {description && <span className='mt-0.5 block text-xs text-muted'>{description}</span>}
            </span>
          </span>
          <Disclosure.Indicator className='shrink-0 text-muted'>
            <ChevronDown size={16} />
          </Disclosure.Indicator>
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className='space-y-5 px-5 pb-5 pt-0 md:px-6 md:pb-6'>{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

/* Label + hint/error shell for controls that aren't a plain <input>
   (comboboxes, date pickers, segmented controls, chip groups). */
export function FieldShell({ label, required, hint, error, fit = false, children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${fit ? 'items-start' : ''}`}>
      {label && (
        <span className='text-[13px] font-medium text-foreground'>
          {label}
          {required && <span className='text-accent'> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <p className='flex items-center gap-1 text-xs text-danger'>
          <CircleAlert size={12} />
          {error}
        </p>
      ) : hint ? (
        <p className='text-xs text-muted'>{hint}</p>
      ) : null}
    </div>
  );
}

/* ─── Segmented control (exclusive choice, 2-3 options) ─────────────── */

export function SegmentedControl({ options, value, onChange, 'aria-label': ariaLabel }) {
  const containerRef = useRef(null);
  const btnRefs = useRef({});
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const el = btnRefs.current[value];
    const container = containerRef.current;
    if (!el || !container) return;

    function measure() {
      const containerBox = container.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      setThumb({ left: elBox.left - containerBox.left, width: elBox.width });
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role='radiogroup'
      aria-label={ariaLabel}
      className='relative inline-flex rounded-lg border border-default bg-surface-secondary p-0.5'
    >
      {thumb && (
        <span
          aria-hidden='true'
          className='absolute top-0.5 bottom-0.5 rounded-md bg-surface shadow-sm transition-[left,width] duration-200 ease-out motion-reduce:transition-none'
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}
      {options.map((op) => {
        const active = value === op.value;
        return (
          <button
            key={op.value}
            ref={(el) => { btnRefs.current[op.value] = el; }}
            type='button'
            role='radio'
            aria-checked={active}
            onClick={() => onChange(op.value)}
            className={`relative z-10 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
              active ? 'text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Chip toggle group (independent booleans, e.g. luggage) ───────── */

export function ChipToggle({ label, checked, onChange }) {
  return (
    <button
      type='button'
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
        checked
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-default bg-surface text-muted hover:border-muted/60 hover:text-foreground'
      }`}
    >
      {checked && <Check size={12} strokeWidth={2.5} />}
      {label}
    </button>
  );
}

/* ─── Number input ──────────────────────────────────────────────────── */

export function NumberInput({ label, value, onChange, min = 0, withButtons = false, formatOptions, className = '' }) {
  return (
    <FieldShell label={label}>
      <NumberField
        value={value ?? NaN}
        onChange={(v) => onChange(isNaN(v) ? null : v)}
        minValue={min}
        formatOptions={formatOptions ?? { maximumFractionDigits: 0, useGrouping: false }}
        className={`w-full ${className}`}
      >
        <NumberField.Group className='flex h-10 items-center overflow-hidden rounded-lg border border-default bg-surface transition-colors hover:border-muted/60'>
          {withButtons && (
            <NumberField.DecrementButton className='flex h-full items-center border-r border-default px-2.5 text-muted transition-colors hover:bg-surface-secondary'>
              <Minus size={13} />
            </NumberField.DecrementButton>
          )}
          <NumberField.Input className='h-full min-w-0 flex-1 bg-transparent px-3 text-center text-sm outline-none' />
          {withButtons && (
            <NumberField.IncrementButton className='flex h-full items-center border-l border-default px-2.5 text-muted transition-colors hover:bg-surface-secondary'>
              <Plus size={13} />
            </NumberField.IncrementButton>
          )}
        </NumberField.Group>
      </NumberField>
    </FieldShell>
  );
}

/* ─── Star rating ────────────────────────────────────────────────────── */

export function StarRating({ value, onChange }) {
  return (
    <div className='flex h-10 items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
          aria-pressed={value >= n}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`px-0.5 text-lg leading-none transition-colors ${
            n <= value ? 'text-warning' : 'text-muted/25 hover:text-warning/50'
          }`}
        >
          ★
        </button>
      ))}
      {value > 0 && <span className='ml-1 text-xs text-muted'>{value} estrella{value !== 1 ? 's' : ''}</span>}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

export function buildRouteLabel(form) {
  if (form.tripType === 'multi') return form.customRoute || '—';
  const origin = form.originCity || form.originCountry || '?';
  const dest = form.destinationCity || form.destinationCountry || '?';
  if (form.tripType === 'round-trip') return `${origin} → ${dest} → ${origin}`;
  return `${origin} → ${dest}`;
}

export function formatPrice(value, currency) {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/* Returns { key: message } for the fields the controller requires. */
export function validateOfferForm(form) {
  const fieldErrors = {};

  if (!form.title) fieldErrors.title = 'El título es obligatorio.';
  if (form.tripType === 'multi') {
    if (!form.customRoute) fieldErrors.customRoute = 'La ruta es obligatoria para viajes multi-destino.';
  } else if (!form.destinationCountry) {
    fieldErrors.destinationCountry = 'El país de destino es obligatorio.';
  }
  if (!form.status) fieldErrors.status = 'Selecciona un estado.';

  return fieldErrors;
}
