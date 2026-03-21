'use client';

import { useState } from 'react';
import { Calendar, Popover } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePickerField({ label, value, onChange, placeholder = 'Seleccionar fecha', triggerClassName, minValue }) {
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
    : placeholder;

  const defaultTriggerClass = 'h-10 px-3 rounded-lg border border-default w-full flex items-center gap-2 text-sm text-left hover:bg-surface-secondary transition-colors';

  return (
    <label className='space-y-1 block'>
      {label && <span className='text-sm font-medium'>{label}</span>}
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <button
            type='button'
            className={triggerClassName ?? defaultTriggerClass}
          >
            <CalendarIcon size={14} className='flex-shrink-0' />
            <span className={calValue ? '' : 'opacity-60'}>{displayLabel}</span>
          </button>
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Dialog>
            <Calendar
              value={calValue}
              minValue={minValue}
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
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </label>
  );
}
