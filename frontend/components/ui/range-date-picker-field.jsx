'use client';

import { useState } from 'react';
import {
  RangeCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
  Button,
  Heading,
} from 'react-aria-components';
import { Popover } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
            value={value}
            onChange={handleChange}
            className='flex flex-col rounded-xl bg-surface p-4'
            style={{ width: 288 }}
          >
            {/* Header con nav */}
            <header className='flex items-center justify-between mb-4 px-1'>
              <Button
                slot='previous'
                className='rounded-lg p-1.5 hover:bg-surface-secondary transition-colors text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer'
              >
                <ChevronLeft size={16} />
              </Button>
              <Heading className='text-base font-semibold text-foreground tracking-tight' />
              <Button
                slot='next'
                className='rounded-lg p-1.5 hover:bg-surface-secondary transition-colors text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer'
              >
                <ChevronRight size={16} />
              </Button>
            </header>

            {/* Grilla del calendario */}
            <CalendarGrid className='w-full border-separate border-spacing-0'>
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className='text-xs font-medium text-muted text-center pb-2 w-9 h-8'>
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isSelectionStart, isSelectionEnd, isOutsideMonth }) =>
                      cn(
                        'relative p-0 text-center h-9 w-9',
                        // franja de fondo para el rango
                        isSelected && !isOutsideMonth && 'bg-accent/15',
                        // redondear extremos de la franja
                        isSelectionStart && !isOutsideMonth && 'rounded-l-full',
                        isSelectionEnd && !isOutsideMonth && 'rounded-r-full',
                        // si es inicio Y fin (un solo día seleccionado)
                        isSelectionStart && isSelectionEnd && 'rounded-full',
                      )
                    }
                  >
                    {({ isSelected, isSelectionStart, isSelectionEnd, isOutsideMonth, formattedDate, isFocusVisible, isDisabled }) => (
                      <span
                        className={cn(
                          'h-9 w-9 rounded-full text-sm font-medium outline-none transition-all',
                          'inline-flex items-center justify-center',
                          // estado base
                          !isSelected && !isOutsideMonth && !isDisabled && 'hover:bg-surface-secondary cursor-pointer',
                          // en el rango pero no en los extremos
                          isSelected && !isSelectionStart && !isSelectionEnd && 'hover:bg-accent/25',
                          // extremos: círculo lleno accent
                          (isSelectionStart || isSelectionEnd) && !isOutsideMonth && 'bg-accent text-white hover:bg-accent/90',
                          // fuera del mes actual
                          isOutsideMonth && 'text-muted/30 cursor-default',
                          // días deshabilitados
                          isDisabled && !isOutsideMonth && 'text-muted/40 cursor-not-allowed',
                          // foco visible
                          isFocusVisible && 'ring-2 ring-accent ring-offset-1',
                        )}
                      >
                        {formattedDate}
                      </span>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>

            {/* Leyenda */}
            {startDate && !endDate && (
              <p className='text-xs text-muted text-center mt-3'>
                Ahora seleccioná la fecha de {endLabel.toLowerCase()}
              </p>
            )}
          </RangeCalendar>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
