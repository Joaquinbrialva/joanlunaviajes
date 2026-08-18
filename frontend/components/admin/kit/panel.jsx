'use client';

import { Drawer } from '@heroui/react';

/**
 * The one side-panel shape for the admin: forms (user create/edit) and record
 * previews (offer/destination/inquiry) both open here. Pass `title` for a
 * plain heading, or `header` for a custom block (thumbnail + status + meta).
 */
export default function Panel({ isOpen, onClose, title, header, footer, children, size = 'md' }) {
  const width = size === 'lg' ? 'sm:w-[520px]' : 'sm:w-[440px]';

  return (
    <Drawer isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Drawer.Backdrop variant='blur'>
        <Drawer.Content placement='right' className={`w-full ${width}`}>
          <Drawer.Dialog className='relative'>
            <Drawer.CloseTrigger className='absolute right-4 top-4 z-10' />
            {header ? (
              <div className='shrink-0 border-b border-default px-5 py-4 pr-12'>{header}</div>
            ) : (
              <Drawer.Header>
                <Drawer.Heading>{title}</Drawer.Heading>
              </Drawer.Header>
            )}
            <Drawer.Body className='flex-1 overflow-y-auto'>{children}</Drawer.Body>
            {footer && <Drawer.Footer>{footer}</Drawer.Footer>}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
