'use client';

import { TextField, Input, TextArea, Label, Description, FieldError } from '@heroui/react';

/**
 * One text-input shape for the whole admin. Wraps HeroUI's TextField/Input so
 * every form field — dashboard, drawers, multi-step wizards — shares the same
 * label, focus ring, invalid state and hint styling instead of each page
 * hand-rolling its own <input className="..."> block.
 */
export function TextInputField({
  label,
  hint,
  error,
  required = false,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  return (
    <TextField isRequired={required} isInvalid={!!error} className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label className='text-[13px] font-medium text-foreground'>{label}</Label>
      )}
      <Input {...inputProps} className={inputClassName} />
      {error ? (
        <FieldError className='text-xs text-danger'>{error}</FieldError>
      ) : hint ? (
        <Description className='text-xs text-muted'>{hint}</Description>
      ) : null}
    </TextField>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  required = false,
  className = '',
  inputClassName = '',
  rows = 4,
  ...inputProps
}) {
  return (
    <TextField isRequired={required} isInvalid={!!error} className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <Label className='text-[13px] font-medium text-foreground'>{label}</Label>
      )}
      <TextArea rows={rows} {...inputProps} className={inputClassName} />
      {error ? (
        <FieldError className='text-xs text-danger'>{error}</FieldError>
      ) : hint ? (
        <Description className='text-xs text-muted'>{hint}</Description>
      ) : null}
    </TextField>
  );
}
