'use client';

import { useEffect, useRef, useState } from 'react';
import { LuX, LuPlus, LuRefreshCw, LuTriangleAlert, LuScissors } from 'react-icons/lu';
import NovedadCropDialog, { TARGET_ASPECT } from '@/components/admin/novedad-crop-dialog';
import NovedadVideoTrimDialog from '@/components/admin/novedad-video-trim-dialog';

const ASPECT_TOLERANCE = 0.1; // 10% de margen antes de pedir recorte
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

function videoStyle(item) {
  const zoom = item.zoom || 1;
  const fp = item.focalPoint || { x: 50, y: 50 };
  return {
    objectPosition: `${fp.x}% ${fp.y}%`,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
  };
}

function CircleProgress({ value = 0, size = 'sm', className = '' }) {
  const r = size === 'md' ? 18 : 12;
  const sw = size === 'md' ? 3 : 2.5;
  const dim = (r + sw) * 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={dim} height={dim} className={className} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={dim / 2} cy={dim / 2} r={r} fill='none' stroke='currentColor' strokeWidth={sw} opacity={0.2} />
      <circle cx={dim / 2} cy={dim / 2} r={r} fill='none' stroke='currentColor' strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap='round' />
    </svg>
  );
}

// items: [{ url, type: 'image'|'video', trimStart?, trimEnd?, zoom?, focalPoint? }]
export default function NovedadImagePicker({ items = [], onChange, maxImages }) {
  const inputRef = useRef(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const [pending, setPending] = useState([]);
  const [cropQueue, setCropQueue] = useState([]); // [{ file, url }]
  const [trimQueue, setTrimQueue] = useState([]); // [{ file, url }]
  const [editingTrimIndex, setEditingTrimIndex] = useState(null); // índice en items que se está reeditando
  const [fileNames, setFileNames] = useState({}); // { [url]: originalFileName }
  const nextId = useRef(0);

  const currentCrop = cropQueue[0] || null;
  const currentTrim = trimQueue[0] || null;
  const editingItem = editingTrimIndex !== null ? items[editingTrimIndex] : null;

  function updatePending(id, patch) {
    setPending((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function uploadBlob(blob, id, filename, endpoint, buildItem) {
    const fd = new FormData();
    fd.append('file', blob, filename);
    if (endpoint === '/api/upload/media') fd.append('folder', 'novedades');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) updatePending(id, { progress: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          const item = buildItem(data.url);
          const next = maxImages === 1 ? [item] : [...itemsRef.current, item];
          itemsRef.current = next;
          onChange(next);
          setFileNames((prev) => (maxImages === 1 ? { [item.url]: filename } : { ...prev, [item.url]: filename }));
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

  function startUpload(file, localUrl, id, filename, kind, endpoint, buildItem) {
    setPending((prev) => [...prev, { id, localUrl, file, kind, status: 'uploading', progress: 0, error: null, endpoint, buildItem }]);
    uploadBlob(file, id, filename, endpoint, buildItem);
  }

  async function handleFiles(fileList) {
    const all = Array.from(fileList || []);
    const images = all.filter((f) => f.type.startsWith('image/') && f.size <= MAX_IMAGE_BYTES);
    const videos = all.filter((f) => f.type.startsWith('video/') && f.size <= MAX_VIDEO_BYTES);

    const toCrop = [];
    for (const file of images) {
      const { url, width, height } = await readImageDimensions(file);
      const ratio = width / height;
      const withinTolerance = Math.abs(ratio - TARGET_ASPECT) / TARGET_ASPECT <= ASPECT_TOLERANCE;
      if (withinTolerance) {
        startUpload(file, url, `upload-${nextId.current++}`, file.name, 'image', '/api/upload', (uploadedUrl) => ({ url: uploadedUrl, type: 'image' }));
      } else {
        toCrop.push({ file, url });
      }
    }
    if (toCrop.length) setCropQueue((prev) => [...prev, ...toCrop]);

    if (videos.length) {
      const toTrim = videos.map((file) => ({ file, url: URL.createObjectURL(file) }));
      setTrimQueue((prev) => [...prev, ...toTrim]);
    }
  }

  function handleCropCancel() {
    setCropQueue((prev) => prev.slice(1));
  }

  function handleCropConfirm(blob) {
    const { file } = cropQueue[0];
    startUpload(blob, URL.createObjectURL(blob), `upload-${nextId.current++}`, file.name, 'image', '/api/upload', (uploadedUrl) => ({ url: uploadedUrl, type: 'image' }));
    setCropQueue((prev) => prev.slice(1));
  }

  function handleTrimCancel() {
    if (editingTrimIndex !== null) {
      setEditingTrimIndex(null);
    } else {
      setTrimQueue((prev) => prev.slice(1));
    }
  }

  function handleTrimConfirm({ trimStart, trimEnd, zoom, focalPoint }) {
    if (editingTrimIndex !== null) {
      const next = items.map((it, i) => (i === editingTrimIndex ? { ...it, trimStart, trimEnd, zoom, focalPoint } : it));
      itemsRef.current = next;
      onChange(next);
      setEditingTrimIndex(null);
      return;
    }
    const { file } = trimQueue[0];
    startUpload(file, URL.createObjectURL(file), `upload-${nextId.current++}`, file.name, 'video', '/api/upload/media', (uploadedUrl) => ({ url: uploadedUrl, type: 'video', trimStart, trimEnd, zoom, focalPoint }));
    setTrimQueue((prev) => prev.slice(1));
  }

  function retryOne(item) {
    updatePending(item.id, { status: 'uploading', progress: 0, error: null });
    uploadBlob(item.file, item.id, item.file.name || 'novedad', item.endpoint, item.buildItem);
  }

  function removeItem(i) {
    const next = items.filter((_, j) => j !== i);
    itemsRef.current = next;
    onChange(next);
  }

  const atLimit = maxImages ? items.length + pending.length >= maxImages : false;
  const isUploading = pending.some((p) => p.status === 'uploading');
  const tileClass = maxImages === 1 ? 'aspect-[3/1] w-full' : 'h-24 w-32';

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-3'>
        {items.map((item, i) => (
          <div key={`${item.url}-${i}`} className={`relative overflow-hidden rounded-xl border border-default bg-surface-secondary ${tileClass}`} title={fileNames[item.url] || undefined}>
            {item.type === 'video' ? (
              <video src={item.url} className='h-full w-full object-cover pointer-events-none' style={videoStyle(item)} muted playsInline />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.url} alt={`Elemento ${i + 1}`} className='h-full w-full object-cover pointer-events-none' />
            )}
            {item.type === 'video' && (
              <button
                type='button'
                onClick={() => setEditingTrimIndex(i)}
                className='absolute left-1 top-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white transition-colors hover:bg-black/80'
                title='Editar recorte'
              >
                <LuScissors className='h-2.5 w-2.5' /> editar recorte
              </button>
            )}
            <button
              type='button'
              onClick={() => removeItem(i)}
              className='absolute right-1 top-1 grid h-6 w-6 place-content-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80'
              title='Quitar'
            >
              <LuX className='h-3 w-3' />
            </button>
            {fileNames[item.url] && (
              <p className='absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-[9px] leading-tight text-white'>
                {fileNames[item.url]}
              </p>
            )}
          </div>
        ))}

        {pending.map((item) => (
          <div key={item.id} className={`relative overflow-hidden rounded-xl border border-default bg-surface-secondary ${tileClass}`} title={item.file?.name || undefined}>
            {item.kind === 'video' ? (
              <video src={item.localUrl} className='h-full w-full object-cover opacity-60 pointer-events-none' muted playsInline />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.localUrl} alt='Subiendo…' className='h-full w-full object-cover opacity-60 pointer-events-none' />
            )}
            {item.status === 'uploading' && item.file?.name && (
              <p className='absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-[9px] leading-tight text-white'>
                {item.file.name}
              </p>
            )}
            {item.status === 'uploading' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white'>
                <CircleProgress value={item.progress} size='md' />
                <span className='text-[10px] font-semibold'>{item.progress}%</span>
              </div>
            )}
            {item.status === 'error' && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 p-1'>
                <LuTriangleAlert className='h-4 w-4 text-rose-400' />
                <p className='text-center text-[9px] leading-tight text-white'>{item.error}</p>
                <div className='flex gap-1'>
                  <button type='button' onClick={() => retryOne(item)} className='flex h-5 items-center gap-0.5 rounded bg-white/20 px-1.5 text-[9px] font-semibold text-white hover:bg-white/30'>
                    <LuRefreshCw className='h-2.5 w-2.5' /> Reintentar
                  </button>
                  <button type='button' onClick={() => setPending((p) => p.filter((x) => x.id !== item.id))} className='h-5 w-5 grid place-content-center rounded bg-white/20 text-white hover:bg-white/30'>
                    <LuX className='h-2.5 w-2.5' />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!atLimit && maxImages === 1 && (
          <button
            type='button'
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-default text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground cursor-pointer ${tileClass}`}
          >
            <LuPlus className='h-5 w-5' />
            <span className='text-xs'>Agregar</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*,video/*'
        multiple={maxImages !== 1}
        className='sr-only'
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {!atLimit && (
        <div
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className='flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-default px-4 py-3 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground'
        >
          <LuPlus className='h-3.5 w-3.5 shrink-0' />
          {maxImages === 1 ? 'Hacé clic para elegir una imagen o video' : 'Arrastrá imágenes o videos aquí o hacé clic para seleccionarlos — cada uno se publica como una novedad separada'}
        </div>
      )}

      <p className='text-xs text-muted'>
        Recomendado: 1920×640px (ratio 3:1) — mismo formato que el banner principal. Si la imagen no cumple el ratio, se abrirá una herramienta para recortarla. Los videos se pueden recortar en duración y encuadre (arrastrando, igual que las imágenes) antes de subir, y reeditar después con “editar recorte”.
        {isUploading && ' · subiendo…'}
        {' · Imágenes: PNG, JPG, WEBP, máx. 8 MB · Videos: máx. 100 MB'}
      </p>

      <NovedadCropDialog
        isOpen={!!currentCrop}
        imageSrc={currentCrop?.url}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />

      <NovedadVideoTrimDialog
        isOpen={!!currentTrim || editingTrimIndex !== null}
        videoSrc={editingItem ? editingItem.url : currentTrim?.url}
        initial={editingItem || undefined}
        onCancel={handleTrimCancel}
        onConfirm={handleTrimConfirm}
      />
    </div>
  );
}
