'use client';

import Link from 'next/link';
import { buttonVariants } from '@heroui/react';

/**
 * A Next <Link> styled like a HeroUI Button. HeroUI's Button always renders a
 * real <button> (no asChild/Slot support), so link-shaped actions render
 * through this instead of nesting an anchor inside a button.
 */
export default function LinkButton({ variant = 'primary', size = 'md', fullWidth, isIconOnly, className = '', children, ...linkProps }) {
  return (
    <Link className={`${buttonVariants({ variant, size, fullWidth, isIconOnly })} ${className}`} {...linkProps}>
      {children}
    </Link>
  );
}
