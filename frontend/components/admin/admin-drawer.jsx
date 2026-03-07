'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function AdminDrawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-surface z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
