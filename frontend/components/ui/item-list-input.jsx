'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function ItemListInput({ label, items = [], onChange, placeholder = 'Agregar ítem...' }) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setInput('');
  }

  function remove(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }

  return (
    <div className='space-y-2'>
      {label && <span className='text-sm font-medium block'>{label}</span>}

      <div className='flex gap-2'>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className='h-9 px-3 rounded-lg border border-default flex-1 text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-accent'
        />
        <button
          type='button'
          onClick={add}
          disabled={!input.trim()}
          className='h-9 px-3 rounded-lg bg-surface-secondary border border-default hover:bg-surface-tertiary disabled:opacity-40 transition-colors flex items-center gap-1 text-sm font-medium'
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>

      {items.length > 0 && (
        <ul className='flex flex-wrap gap-2'>
          {items.map((item, i) => (
            <li
              key={i}
              className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-surface-secondary border border-default'
            >
              <span>{item}</span>
              <button
                type='button'
                onClick={() => remove(i)}
                className='text-muted hover:text-foreground transition-colors'
                aria-label={`Eliminar ${item}`}
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && (
        <p className='text-xs text-muted'>Sin ítems. Escribí y presioná Enter o "Agregar".</p>
      )}
    </div>
  );
}
