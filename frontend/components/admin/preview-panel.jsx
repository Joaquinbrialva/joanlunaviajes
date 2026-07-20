'use client';

import { useEffect } from 'react';

export default function PreviewPanel({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <div
      role='dialog'
      aria-modal='false'
      className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-default bg-surface shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:w-[440px] ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {children}
    </div>
  );
}
