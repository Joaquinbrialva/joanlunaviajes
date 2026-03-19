'use client';

import { ListBox, Select } from '@heroui/react';

export default function HeroSelect({
  value,
  onValueChange,
  options,
  className = 'w-full',
  triggerClassName = '',
}) {
  return (
    <Select
      className={className}
      selectedKey={value != null && value !== '' ? String(value) : null}
      onSelectionChange={(key) => onValueChange(key != null ? String(key) : '')}
    >
      <Select.Trigger className={`flex items-center gap-2 ${triggerClassName}`}>
        <Select.Value className='flex-1' />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
