'use client';

import { AlertDialog, Button } from '@heroui/react';

/**
 * The one confirmation-dialog shape for the admin (deletes, destructive
 * toggles). Wraps HeroUI's AlertDialog so every page stops re-typing the
 * same Backdrop/Container/Dialog/Header/Footer boilerplate.
 */
export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  status = 'danger',
  title,
  children,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
}) {
  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop variant='blur'>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status={status} />
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <div className='text-sm text-muted'>{children}</div>
            </AlertDialog.Body>
            <AlertDialog.Footer className='flex justify-end gap-2'>
              <Button slot='close' variant='tertiary'>{cancelLabel}</Button>
              <Button onClick={onConfirm} slot='close' variant={status === 'danger' ? 'danger' : 'primary'}>
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
