'use client';

import { Checkbox } from '@heroui/react';

export default function RowCheckbox({ checked, onChange }) {
  return (
    <Checkbox isSelected={checked} onChange={onChange}>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox>
  );
}
