'use client';

import { useState } from 'react';
import { Calendar, Popover } from '@heroui/react';
import { CalendarGridBody } from 'react-aria-components';
import { parseDate } from '@internationalized/date';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);

  const calValue = (() => {
    try { return value ? parseDate(value) : null; } catch { return null; }
  })();

  const displayLabel = calValue
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Seleccionar fecha';

  return (
    <label className='space-y-1 block'>
      {label && <span className='text-sm font-medium'>{label}</span>}
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <button
            type='button'
            className='h-10 px-3 rounded-lg border border-default w-full flex items-center gap-2 text-sm text-left hover:bg-surface-secondary transition-colors'
          >
            <CalendarIcon size={14} className='text-muted flex-shrink-0' />
            <span className={calValue ? '' : 'text-muted'}>{displayLabel}</span>
          </button>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog>
            <Calendar
              value={calValue}
              onChange={(date) => {
                onChange(date.toString());
                setOpen(false);
              }}
            >
              <Calendar.Header>
                <Calendar.NavButton slot='previous'>
                  <ChevronLeft size={16} />
                </Calendar.NavButton>
                <Calendar.Heading />
                <Calendar.NavButton slot='next'>
                  <ChevronRight size={16} />
                </Calendar.NavButton>
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <CalendarGridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </CalendarGridBody>
              </Calendar.Grid>
            </Calendar>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </label>
  );
}
