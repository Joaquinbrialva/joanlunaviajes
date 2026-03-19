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
function CircleProgress({ value = 0 }) {
  const r = 12, sw = 2.5, dim = (r + sw) * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={dim} height={dim} className='text-accent' style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke='currentColor' strokeWidth={sw} opacity={0.2} />
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke='currentColor' strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap='round' />
    </svg>
  );
}

export default function CoverImageInput({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file) {
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
    setProgress(0);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onChange(data.url);
        } else {
          setError(data.error || 'Error al subir la imagen.');
        }
      } catch {
        setError('No se pudo subir la imagen.');
      }
      setUploading(false);
    };
    xhr.onerror = () => { setError('Error de red.'); setUploading(false); };
    xhr.send(fd);
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
              <CircleProgress value={progress} />
              <span>Subiendo… {progress}%</span>
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
