'use client';

import { ListBox, Select } from '@heroui/react';

function getFirstSelection(selection) {
  if (selection == null) return '';
  if (typeof selection === 'string' || typeof selection === 'number') {
    return String(selection);
  }
  if (selection instanceof Set) {
    return String(selection.values().next().value ?? '');
  }
  if (typeof selection === 'object' && 'currentKey' in selection) {
    return String(selection.currentKey ?? '');
  }
  return '';
}

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
      selectedKeys={new Set([String(value)])}
      onSelectionChange={(selection) => onValueChange(getFirstSelection(selection))}
    >
      <Select.Trigger className={triggerClassName}>
        <Select.Value />
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
