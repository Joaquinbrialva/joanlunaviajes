'use client';

import { Autocomplete, ListBox, SearchField } from '@heroui/react';
import airlines, { getLogoUrl } from '@/lib/airlines';

export default function AirlineCombobox({ value, iata, onChange }) {
  return (
    <Autocomplete
      selectedKey={iata || null}
      onSelectionChange={(key) => {
        if (!key) { onChange({ name: '', iata: '' }); return; }
        const airline = airlines.find((a) => a.iata === String(key));
        if (airline) onChange({ name: airline.name, iata: airline.iata });
      }}
      onClear={() => onChange({ name: '', iata: '' })}
      fullWidth
    >
      <Autocomplete.Trigger className='h-10 rounded-lg border border-default bg-surface px-3 flex items-center gap-2 w-full text-sm cursor-pointer'>
        <Autocomplete.Value
          placeholder='Buscar aerolínea...'
          className='flex-1 flex items-center gap-2 min-w-0 text-left'
        />
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>

      <Autocomplete.Popover>
        <Autocomplete.Filter>
          <SearchField autoFocus className='p-2 border-b border-default'>
            <SearchField.Group className='h-9 flex items-center gap-1 px-2 rounded-lg border border-default bg-surface-secondary'>
              <SearchField.SearchIcon className='w-4 h-4 text-muted shrink-0' />
              <SearchField.Input className='flex-1 bg-transparent text-sm outline-none' placeholder='Filtrar aerolíneas...' />
              <SearchField.ClearButton className='text-muted' />
            </SearchField.Group>
          </SearchField>

          <ListBox className='max-h-52 overflow-y-auto p-1'>
            {airlines.map((airline) => (
              <ListBox.Item
                key={airline.iata}
                id={airline.iata}
                textValue={airline.name}
                className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-surface-secondary data-[selected=true]:bg-accent/10 cursor-pointer outline-none data-focused:bg-surface-secondary'
              >
                <img
                  src={getLogoUrl(airline.iata)}
                  alt={airline.name}
                  className='h-5 w-8 object-contain shrink-0'
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className='flex-1 truncate'>{airline.name}</span>
                <span className='text-xs text-muted font-mono w-8 text-right shrink-0'>{airline.iata}</span>
              </ListBox.Item>
            ))}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}
