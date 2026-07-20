'use client';

import { useEffect } from 'react';

export default function PreviewModal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div className={`fixed inset-0 z-[70] bg-surface transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}
