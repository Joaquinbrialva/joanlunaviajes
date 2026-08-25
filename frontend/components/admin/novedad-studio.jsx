'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Button, Switch, Spinner } from '@heroui/react';
import { LuX, LuPlus } from 'react-icons/lu';
import { TARGET_ASPECT, getCroppedBlob, getDefaultCroppedAreaPixels } from '@/components/admin/novedad-crop-dialog';
import { VideoFrameEditor, formatTime } from '@/components/admin/novedad-video-trim-dialog';
import { toastError } from '@/lib/toast';

let uid = 0;
function nextId() {
  uid += 1;
  return `studio-${uid}`;
}

function itemFromFile(file) {
  const kind = file.type.startsWith('video/') ? 'video' : 'image';
  return {
    id: nextId(),
    kind,
    file,
    url: URL.createObjectURL(file),
    isExisting: false,
    dirty: true,
    status: 'published',
    cropPos: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    videoZoom: 1,
    focalPoint: { x: 50, y: 50 },
    trimStart: 0,
    trimEnd: 0,
    duration: 0,
    natural: null,
  };
}

function itemFromExisting(media, status) {
  const kind = media.type === 'video' ? 'video' : 'image';
  return {
    id: nextId(),
    kind,
    file: null,
    url: media.url,
    isExisting: true,
    dirty: false,
    status: status || 'published',
    cropPos: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    videoZoom: media.zoom || 1,
    focalPoint: media.focalPoint || { x: 50, y: 50 },
    trimStart: media.trimStart || 0,
    trimEnd: media.trimEnd || 0,
    duration: 0,
    natural: null,
  };
}

async function uploadFile(blobOrFile, filename, endpoint) {
  const fd = new FormData();
  fd.append('file', blobOrFile, filename);
  if (endpoint === '/api/upload/media') fd.append('folder', 'novedades');
  const res = await fetch(endpoint, { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir.');
  return data.url;
}

/**
 * Editor de novedades a pantalla completa: el recorte pasa en el mismo lienzo
 * (sin diálogo anidado), con un filmstrip abajo para el lote — cada elemento
 * con su propio estado — y el título como campo único arriba.
 */
export default function NovedadStudio({ isOpen, editing, initialMedia, initialCaption, initialStatus, onClose, onSubmit }) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [caption, setCaption] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  const isSingle = !!editing;

  useEffect(() => {
    if (!isOpen) return;
    if (editing && initialMedia?.[0]) {
      const seeded = itemFromExisting(initialMedia[0], initialStatus);
      setItems([seeded]);
      setActiveId(seeded.id);
    } else {
      setItems([]);
      setActiveId(null);
    }
    setCaption(initialCaption || '');
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const activeItem = items.find((it) => it.id === activeId) || null;

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length === 0) return;
    const newItems = files.map(itemFromFile);
    if (isSingle) {
      setItems([newItems[0]]);
      setActiveId(newItems[0].id);
    } else {
      setItems((prev) => [...prev, ...newItems]);
      setActiveId(newItems[0].id);
    }
  }

  function removeItem(id) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  function handleVideoLoadedMetadata(id) {
    const v = videoRef.current;
    const item = items.find((it) => it.id === id);
    if (!v || !item || item.natural) return;
    const natural = { w: v.videoWidth, h: v.videoHeight };
    const duration = v.duration || 0;
    const trimEnd = item.trimEnd && item.trimEnd > 0 ? item.trimEnd : duration;
    v.currentTime = item.trimStart || 0;
    updateItem(id, { natural, duration, trimEnd });
  }

  function handleVideoTimeUpdate(id) {
    const v = videoRef.current;
    const item = items.find((it) => it.id === id);
    if (!v || !item) return;
    if (v.currentTime < item.trimStart || v.currentTime >= item.trimEnd) {
      v.currentTime = item.trimStart;
      if (v.paused) v.play().catch(() => {});
    }
  }

  function handleTrimStartChange(e) {
    const v = Number(e.target.value);
    const next = Math.min(v, activeItem.trimEnd - 0.1);
    updateItem(activeItem.id, { trimStart: next < 0 ? 0 : next, dirty: true });
    if (videoRef.current) videoRef.current.currentTime = next;
  }

  function handleTrimEndChange(e) {
    const v = Number(e.target.value);
    const next = Math.max(v, activeItem.trimStart + 0.1);
    updateItem(activeItem.id, { trimEnd: next > activeItem.duration ? activeItem.duration : next, dirty: true });
    if (videoRef.current) videoRef.current.currentTime = next;
  }

  async function handlePublish() {
    if (items.length === 0) {
      toastError('Agregá al menos una imagen o video.');
      return;
    }
    setSaving(true);
    try {
      const result = [];
      for (const item of items) {
        if (item.kind === 'image') {
          if (item.isExisting && !item.dirty) {
            result.push({ media: { url: item.url, type: 'image' }, status: item.status });
            continue;
          }
          const cropPixels = item.croppedAreaPixels || await getDefaultCroppedAreaPixels(item.url);
          const blob = await getCroppedBlob(item.url, cropPixels);
          const url = await uploadFile(blob, item.file?.name || 'novedad.jpg', '/api/upload');
          result.push({ media: { url, type: 'image' }, status: item.status });
        } else {
          let url = item.url;
          if (item.file) url = await uploadFile(item.file, item.file.name, '/api/upload/media');
          result.push({
            media: { url, type: 'video', trimStart: item.trimStart, trimEnd: item.trimEnd, zoom: item.videoZoom, focalPoint: item.focalPoint },
            status: item.status,
          });
        }
      }
      await onSubmit({ items: result, caption });
    } catch (err) {
      toastError(err, 'Error al subir');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='flex max-h-[90vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl'>
        <div className='flex shrink-0 items-center gap-4 px-6 py-4'>
          <h2 className='shrink-0 text-lg font-extrabold tracking-tight text-foreground'>{editing ? 'Editar novedad' : 'Nueva novedad'}</h2>
          <input
            type='text'
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder='Título interno (opcional, para buscarla después)'
            disabled={saving}
            className='h-9 min-w-0 flex-1 rounded-lg bg-surface-secondary px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60'
          />
          <div className='flex shrink-0 items-center gap-3'>
            <Button type='button' variant='tertiary' onClick={onClose} isDisabled={saving}>Cancelar</Button>
            <Button type='button' onClick={handlePublish} isDisabled={saving}>
              {saving ? <Spinner color='current' size='sm' /> : null}
              {saving ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>

        <div className={`flex min-h-0 flex-col gap-4 overflow-y-auto p-6 pt-0 ${saving ? 'pointer-events-none opacity-60' : ''}`}>
          <div
            className='relative aspect-[12/5] w-full shrink-0 overflow-hidden rounded-2xl bg-black'
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            {!activeItem ? (
              <button
                type='button'
                onClick={() => inputRef.current?.click()}
                className={`flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed text-sm text-white/60 transition-colors ${dragOver ? 'border-accent text-white' : 'border-white/20'}`}
              >
                <LuPlus className='h-6 w-6' />
                <span>Arrastrá o hacé clic para elegir una imagen o video</span>
                <span className='text-xs text-white/40'>Tamaño recomendado: 1920×800px (relación 2.4:1)</span>
              </button>
            ) : activeItem.kind === 'image' ? (
              <Cropper
                key={activeItem.id}
                image={activeItem.url}
                crop={activeItem.cropPos}
                zoom={activeItem.zoom}
                aspect={TARGET_ASPECT}
                crossOrigin='anonymous'
                onCropChange={(p) => updateItem(activeItem.id, { cropPos: p })}
                onZoomChange={(z) => updateItem(activeItem.id, { zoom: z })}
                onCropComplete={(_area, pixels) => updateItem(activeItem.id, { croppedAreaPixels: pixels, dirty: true })}
              />
            ) : (
              <VideoFrameEditor
                key={activeItem.id}
                videoRef={(el) => {
                  videoRef.current = el;
                  if (el && el.src !== activeItem.url) {
                    el.src = activeItem.url;
                    el.onloadedmetadata = () => handleVideoLoadedMetadata(activeItem.id);
                    el.ontimeupdate = () => handleVideoTimeUpdate(activeItem.id);
                  }
                }}
                natural={activeItem.natural}
                focalPoint={activeItem.focalPoint}
                zoom={activeItem.videoZoom}
                onZoomChange={(z) => updateItem(activeItem.id, { videoZoom: z, dirty: true })}
                onFocalPointChange={(fp) => updateItem(activeItem.id, { focalPoint: fp, dirty: true })}
              />
            )}
          </div>

          {activeItem?.kind === 'video' && (
            <div className='flex items-center gap-6 rounded-xl border border-default bg-surface-secondary p-3'>
              <div className='flex flex-1 items-center gap-3'>
                <span className='w-12 shrink-0 text-xs text-muted'>Inicio</span>
                <input type='range' min={0} max={activeItem.duration || 0} step={0.1} value={activeItem.trimStart} onChange={handleTrimStartChange} aria-label='Inicio del recorte' className='flex-1 accent-accent' />
                <span className='w-9 shrink-0 text-right text-xs tabular-nums text-muted'>{formatTime(activeItem.trimStart)}</span>
              </div>
              <div className='flex flex-1 items-center gap-3'>
                <span className='w-12 shrink-0 text-xs text-muted'>Fin</span>
                <input type='range' min={0} max={activeItem.duration || 0} step={0.1} value={activeItem.trimEnd} onChange={handleTrimEndChange} aria-label='Fin del recorte' className='flex-1 accent-accent' />
                <span className='w-9 shrink-0 text-right text-xs tabular-nums text-muted'>{formatTime(activeItem.trimEnd)}</span>
              </div>
            </div>
          )}

          <div className='flex items-end justify-between gap-4'>
            <div className={isSingle ? 'invisible' : 'min-w-0 flex-1'}>
              <div className='flex gap-2 overflow-x-auto pb-1'>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setActiveId(item.id)}
                    className={`relative h-[62px] w-[92px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${item.id === activeId ? 'border-accent' : 'border-transparent'}`}
                  >
                    {item.kind === 'video' ? (
                      <video src={item.url} className='pointer-events-none h-full w-full object-cover' muted playsInline />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt='' className='pointer-events-none h-full w-full object-cover' />
                    )}
                    <span className={`absolute left-1.5 top-1.5 h-2 w-2 rounded-full ${item.status === 'published' ? 'bg-success' : 'bg-white/70'}`} />
                    <span
                      role='button'
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                      className='absolute right-1 top-1 grid h-4 w-4 place-content-center rounded-full bg-black/60 text-white'
                    >
                      <LuX className='h-2.5 w-2.5' />
                    </span>
                  </button>
                ))}
                <button
                  type='button'
                  onClick={() => inputRef.current?.click()}
                  className='flex h-[62px] w-[92px] shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-default text-muted transition-colors hover:border-accent/50 hover:text-foreground'
                >
                  <LuPlus className='h-4 w-4' />
                </button>
              </div>
            </div>

            {activeItem && (
              <div className='flex shrink-0 items-center gap-2.5'>
                <span className='text-[13px] font-medium text-foreground'>{activeItem.status === 'published' ? 'Publicada' : 'Borrador'}</span>
                <Switch isSelected={activeItem.status === 'published'} onChange={(checked) => updateItem(activeItem.id, { status: checked ? 'published' : 'draft' })}>
                  <Switch.Control><Switch.Thumb /></Switch.Control>
                </Switch>
              </div>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type='file'
          accept='image/*,video/*'
          multiple={!isSingle}
          disabled={saving}
          className='sr-only'
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}
