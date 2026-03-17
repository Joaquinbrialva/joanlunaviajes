'use client';

import { useRef, useState } from 'react';
import { LuUpload, LuX, LuImage } from 'react-icons/lu';

/**
 * CoverImageInput
 * Props:
 *   value        {string}   – current image URL (displayed as preview)
 *   onChange     {fn}       – called with the new URL after upload
 *   disabled     {boolean}
 */
export default function CoverImageInput({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

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
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen.');
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0]);
    // reset so same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function clearImage() {
    onChange('');
    setError('');
  }

  return (
    <div className='space-y-2'>
      {/* Preview */}
      {value && (
        <div className='relative w-full h-40 rounded-xl overflow-hidden border border-default bg-surface-secondary'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt='Portada' className='h-full w-full object-cover' />
          {!disabled && (
            <button
              type='button'
              onClick={clearImage}
              className='absolute top-2 right-2 grid h-7 w-7 place-content-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80'
              title='Quitar imagen'
            >
              <LuX className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
      {!disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors ${
            dragOver
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-default bg-surface-secondary text-muted hover:border-accent/50 hover:text-foreground'
          } ${uploading ? 'cursor-wait opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <span className='h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent' />
              <span>Subiendo imagen…</span>
            </>
          ) : (
            <>
              {value ? (
                <>
                  <LuImage className='h-5 w-5' />
                  <span>Reemplazar imagen</span>
                </>
              ) : (
                <>
                  <LuUpload className='h-5 w-5' />
                  <span>Arrastrar imagen o <span className='font-semibold text-accent'>seleccionar archivo</span></span>
                  <span className='text-xs'>PNG, JPG, WEBP — máximo 8 MB</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='sr-only'
        onChange={handleInputChange}
        disabled={disabled || uploading}
      />

      {error && <p className='text-xs text-rose-500'>{error}</p>}
    </div>
  );
}
