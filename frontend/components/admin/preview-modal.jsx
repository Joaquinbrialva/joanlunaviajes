'use client';

import { useEffect } from 'react';

export default function PreviewModal({ isOpen, onClose, maxWidth = 'max-w-4xl', children }) {
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
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div
          className={`relative flex flex-col w-full ${maxWidth} rounded-3xl overflow-hidden shadow-2xl bg-surface transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} h-[92vh] md:h-[85vh] max-h-[820px]`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
