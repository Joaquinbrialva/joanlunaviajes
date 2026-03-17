'use client';

import { useRef, useState } from 'react';
import { LuX, LuPlus } from 'react-icons/lu';

/**
 * GalleryEditor
 * Props:
 *   images   {string[]}  — array de URLs
 *   onChange {fn}        — recibe el nuevo array
 *   disabled {boolean}
 */
export default function GalleryEditor({ images = [], onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen no puede superar los 8 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir.');
      onChange([...images, data.url]);
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  }

  function remove(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-3'>
        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className='relative h-24 w-32 overflow-hidden rounded-xl border border-default bg-surface-secondary'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Imagen ${i + 1}`} className='h-full w-full object-cover' />
            {!disabled && (
              <button
                type='button'
                onClick={() => remove(i)}
                className='absolute right-1 top-1 grid h-6 w-6 place-content-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80'
                title='Quitar imagen'
              >
                <LuX className='h-3 w-3' />
              </button>
            )}
            <span className='absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] text-white'>
              {i + 1}
            </span>
          </div>
        ))}

        {!disabled && (
          <button
            type='button'
            onClick={() => !uploading && inputRef.current?.click()}
            className={`flex h-24 w-32 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm transition-colors ${
              uploading
                ? 'cursor-wait border-default text-muted opacity-60'
                : 'cursor-pointer border-default text-muted hover:border-accent/50 hover:text-foreground'
            }`}
          >
            {uploading ? (
              <span className='h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent' />
            ) : (
              <>
                <LuPlus className='h-5 w-5' />
                <span className='text-xs'>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='sr-only'
        disabled={disabled || uploading}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {images.length > 0 && (
        <p className='text-xs text-muted'>
          {images.length} imagen{images.length !== 1 ? 'es' : ''}
        </p>
      )}
      {error && <p className='text-xs text-rose-500'>{error}</p>}
    </div>
  );
}
