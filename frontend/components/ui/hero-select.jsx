'use client';

import { ListBox, Select } from '@heroui/react';

export default function HeroSelect({
  value,
  onValueChange,
  options,
  className = 'w-full',
  triggerClassName = '',
  ariaLabel,
}) {
  return (
    <Select
      className={className}
      aria-label={ariaLabel}
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
              <span className='flex items-center gap-2'>
                {option.dotColor && (
                  <span
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: option.dotColor,
                      flexShrink: 0, display: 'inline-block',
                    }}
                  />
                )}
                {option.label}
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
