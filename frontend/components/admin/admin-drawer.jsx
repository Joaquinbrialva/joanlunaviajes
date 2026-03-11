'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminDrawer({ isOpen, onClose, title, children }) {
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
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-3 bottom-3 right-3 z-50 flex h-auto w-[calc(100%-1.5rem)] max-w-xl flex-col overflow-hidden rounded-3xl border border-default bg-surface shadow-2xl transition-all duration-300 ease-out sm:top-4 sm:bottom-4 sm:right-4 sm:w-full ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0 pointer-events-none'}`}
      >
        <div className='flex items-center justify-between px-5 py-4 border-b border-default shrink-0'>
          <h2 className='font-semibold text-base'>{title}</h2>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface-secondary transition-colors'
          >
            <X size={16} />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto'>{children}</div>
      </div>
    </>
  );
}
