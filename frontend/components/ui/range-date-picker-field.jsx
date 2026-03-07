'use client';

import { useState } from 'react';
import { RangeCalendar, Popover } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { CalendarIcon, X } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RangeDatePickerField({ startDate, endDate, onChange, tripType }) {
  const [open, setOpen] = useState(false);

  const value =
    startDate && endDate
      ? { start: parseDate(startDate), end: parseDate(endDate) }
      : null;

  function handleChange(range) {
    onChange({ start: range.start.toString(), end: range.end.toString() });
    setOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange({ start: '', end: '' });
  }

  const endLabel = tripType === 'one-way' ? 'Llegada' : 'Regreso';

  const displayLabel =
    startDate && endDate ? (
      <span className='flex items-center gap-2'>
        <span className='font-medium'>{formatDate(startDate)}</span>
        <span className='text-muted'>→</span>
        <span className='font-medium'>{formatDate(endDate)}</span>
        <span className='text-xs text-muted ml-1'>({endLabel})</span>
      </span>
    ) : startDate ? (
      <span>
        <span className='font-medium'>{formatDate(startDate)}</span>
        <span className='text-muted ml-2'>→ seleccioná {endLabel.toLowerCase()}...</span>
      </span>
    ) : (
      <span className='text-muted'>Seleccionar fechas de salida y {endLabel.toLowerCase()}</span>
    );

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          type='button'
          className='h-10 px-3 rounded-lg border border-default w-full flex items-center gap-2 text-sm text-left hover:bg-surface-secondary transition-colors'
        >
          <CalendarIcon size={14} className='text-muted flex-shrink-0' />
          <span className='flex-1'>{displayLabel}</span>
          {(startDate || endDate) && (
            <span
              role='button'
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className='text-muted hover:text-foreground transition-colors p-0.5'
              aria-label='Limpiar fechas'
            >
              <X size={13} />
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Content>
        <Popover.Dialog>
          <RangeCalendar
            aria-label='Fechas de vuelo'
            value={value}
            onChange={handleChange}
          >
            <RangeCalendar.Header>
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot='previous' />
              <RangeCalendar.NavButton slot='next' />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>

          {startDate && !endDate && (
            <p className='text-xs text-muted text-center mt-3 px-4 pb-2'>
              Ahora seleccioná la fecha de {endLabel.toLowerCase()}
            </p>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
