'use client';

import { Modal } from '@heroui/react';

/**
 * Centered modal for admin forms that don't fit the side-panel pattern
 * (short forms with no listing/preview context needed, e.g. novedades).
 * Pass `title` for a plain heading, or `header` for a custom block.
 */
export default function Dialog({ isOpen, onClose, title, header, footer, children, size = 'md', dialogClassName = '' }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop variant='blur'>
        <Modal.Container placement='center' size={size}>
          <Modal.Dialog className={`relative ${dialogClassName}`}>
            <Modal.CloseTrigger className='absolute right-4 top-4 z-10' />
            {header ? (
              <div className='shrink-0 px-6 pt-6 pb-2 pr-12'>{header}</div>
            ) : (
              <Modal.Header>
                <Modal.Heading>{title}</Modal.Heading>
              </Modal.Header>
            )}
            <Modal.Body className='flex-1 overflow-y-auto'>{children}</Modal.Body>
            {footer && <Modal.Footer>{footer}</Modal.Footer>}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
