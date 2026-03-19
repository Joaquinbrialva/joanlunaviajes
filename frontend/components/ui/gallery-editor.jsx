'use client';

import { useEffect, useRef, useState } from 'react';
import { LuX, LuPlus, LuRefreshCw, LuTriangleAlert, LuGripVertical } from 'react-icons/lu';

function CircleProgress({ value = 0 }) {
  const r = 12, sw = 2.5, dim = (r + sw) * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={dim} height={dim} className='text-white' style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke='currentColor' strokeWidth={sw} opacity={0.35} />
      <circle cx={dim/2} cy={dim/2} r={r} fill='none' stroke='currentColor' strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap='round' />
    </svg>
  );
}

export default function GalleryEditor({ images = [], onChange, disabled = false }) {
  const inputRef = useRef(null);
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);

  const [pending, setPending] = useState([]);
  // drag-to-reorder state
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null); // index being hovered

  /* ── uploads ── */
  function updatePending(id, patch) {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function uploadOne(file, id) {
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        updatePending(id, { progress: Math.round((e.loaded / e.total) * 100) });
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          const next = [...imagesRef.current, data.url];
          imagesRef.current = next;
          onChange(next);
          setPending((p) => p.filter((x) => x.id !== id));
        } else {
          updatePending(id, { status: 'error', error: data.error || 'Error al subir.' });
        }
      } catch {
        updatePending(id, { status: 'error', error: 'Error al subir.' });
      }
    };
    xhr.onerror = () => updatePending(id, { status: 'error', error: 'Error de red.' });
    xhr.send(fd);
  }

  function handleFiles(files) {
    if (!files?.length) return;
    const valid = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 8 * 1024 * 1024) continue;
      valid.push(file);
    }
    if (!valid.length) return;
    const newPending = valid.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      localUrl: URL.createObjectURL(file),
      file,
      status: 'uploading',
      progress: 0,
      error: null,
    }));
    setPending((prev) => [...prev, ...newPending]);
    newPending.forEach(({ file, id }) => uploadOne(file, id));
  }

  function retryOne(item) {
    updatePending(item.id, { status: 'uploading', progress: 0, error: null });
    uploadOne(item.file, item.id);
  }

  /* ── reorder (HTML5 drag & drop, only on uploaded images) ── */
  function onDragStart(i) {
    dragIndex.current = i;
  }

  function onDragEnter(i) {
    if (dragIndex.current === null || dragIndex.current === i) return;
    setDragOver(i);
  }

  function onDrop(i) {
    const from = dragIndex.current;
    if (from === null || from === i) { reset(); return; }
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
    reset();
  }

  function reset() {
    dragIndex.current = null;
    setDragOver(null);
  }

  const isUploading = pending.some((p) => p.status === 'uploading');

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-3'>

        {/* Uploaded — draggable */}
        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable={!disabled}
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={reset}
            className={`relative h-24 w-32 overflow-hidden rounded-xl border bg-surface-secondary transition-all duration-150 ${
              dragOver === i
                ? 'border-accent scale-105 shadow-lg shadow-accent/20'
                : 'border-default'
            } ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Imagen ${i + 1}`} className='h-full w-full object-cover pointer-events-none' />

            {/* drag handle hint */}
            {!disabled && (
              <span className='absolute top-1 left-1 text-white/60 pointer-events-none'>
                <LuGripVertical className='h-3.5 w-3.5' />
              </span>
            )}

            {!disabled && (
              <button
                type='button'
                onClick={() => onChange(images.filter((_, j) => j !== i))}
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

        {/* Pending uploads */}
        {pending.map((item) => (
          <div
            key={item.id}
            className='relative h-24 w-32 overflow-hidden rounded-xl border border-default bg-surface-secondary'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.localUrl} alt='Subiendo…' className='h-full w-full object-cover opacity-60 pointer-events-none' />

            {item.status === 'uploading' && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                <CircleProgress value={item.progress} />
              </div>
            )}

            {item.status === 'error' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 p-1'>
                <LuTriangleAlert className='h-4 w-4 text-rose-400' />
                <p className='text-center text-[9px] leading-tight text-white'>{item.error}</p>
                <div className='flex gap-1'>
                  <button
                    type='button'
                    onClick={() => retryOne(item)}
                    className='flex h-5 items-center gap-0.5 rounded bg-white/20 px-1.5 text-[9px] font-semibold text-white hover:bg-white/30'
                  >
                    <LuRefreshCw className='h-2.5 w-2.5' /> Reintentar
                  </button>
                  <button
                    type='button'
                    onClick={() => setPending((p) => p.filter((x) => x.id !== item.id))}
                    className='h-5 w-5 grid place-content-center rounded bg-white/20 text-white hover:bg-white/30'
                  >
                    <LuX className='h-2.5 w-2.5' />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add button */}
        {!disabled && (
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className='flex h-24 w-32 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-default text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground cursor-pointer'
          >
            <LuPlus className='h-5 w-5' />
            <span className='text-xs'>Agregar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        className='sr-only'
        disabled={disabled}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Drop zone */}
      {!disabled && (
        <div
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-default px-4 py-3 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground'
        >
          <LuPlus className='h-3.5 w-3.5 shrink-0' />
          Arrastrá varias imágenes aquí o hacé clic para seleccionarlas
        </div>
      )}

      <p className='text-xs text-muted'>
        {images.length + pending.filter((p) => p.status === 'uploading').length} imagen
        {images.length + pending.filter((p) => p.status === 'uploading').length !== 1 ? 'es' : ''}
        {isUploading && ' · subiendo…'}
        {images.length > 1 && !isUploading && ' · arrastrá para reordenar'}
        {' · PNG, JPG, WEBP — máx. 8 MB'}
      </p>
    </div>
  );
}
