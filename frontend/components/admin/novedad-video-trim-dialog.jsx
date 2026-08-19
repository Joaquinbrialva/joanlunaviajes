'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { LuCrop } from 'react-icons/lu';
import Dialog from '@/components/admin/kit/dialog';

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Frame Editor ──────────────────────────────────────────────────────────
// Drag-to-crop estilo Instagram, igual al del Hero — arrastrar y hacer zoom
// sobre el video dentro del frame 3:1 para elegir el encuadre.

export function VideoFrameEditor({ videoRef, natural, focalPoint, zoom, onZoomChange, onFocalPointChange }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const seededRef = useRef(false);

  function getDisplaySize(z) {
    const c = containerRef.current;
    if (!c || !natural) return null;
    const cW = c.offsetWidth;
    const cH = c.offsetHeight;
    const scale = Math.max(cW / natural.w, cH / natural.h);
    return { w: natural.w * scale * z, h: natural.h * scale * z, cW, cH };
  }

  function clampOffset(ox, oy, cW, cH, dW, dH) {
    return {
      x: Math.max(-(dW - cW), Math.min(0, ox)),
      y: Math.max(-(dH - cH), Math.min(0, oy)),
    };
  }

  // Inicializar offset desde el focal point una vez conocidas las dimensiones naturales
  useEffect(() => {
    if (!natural || !containerRef.current || seededRef.current) return;
    const ds = getDisplaySize(zoom);
    if (!ds) return;
    seededRef.current = true;
    const ox = -((focalPoint.x / 100) * (ds.w - ds.cW));
    const oy = -((focalPoint.y / 100) * (ds.h - ds.cH));
    const clamped = clampOffset(ox, oy, ds.cW, ds.cH, ds.w, ds.h);
    setOffset(clamped);
    offsetRef.current = clamped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  // Re-clampear el offset al cambiar el zoom
  useEffect(() => {
    if (!natural) return;
    const ds = getDisplaySize(zoom);
    if (!ds) return;
    const clamped = clampOffset(offsetRef.current.x, offsetRef.current.y, ds.cW, ds.cH, ds.w, ds.h);
    offsetRef.current = clamped;
    setOffset(clamped);
    emitFocalPoint(clamped, ds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural]);

  function emitFocalPoint(off, ds) {
    const fpX = ds.w - ds.cW > 0 ? Math.round((-off.x / (ds.w - ds.cW)) * 100) : 50;
    const fpY = ds.h - ds.cH > 0 ? Math.round((-off.y / (ds.h - ds.cH)) * 100) : 50;
    onFocalPointChange({ x: fpX, y: fpY });
  }

  function handlePointerDown(e) {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startMouseX: clientX, startMouseY: clientY, startOx: offsetRef.current.x, startOy: offsetRef.current.y };
    setIsDragging(true);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const ds = getDisplaySize(zoom);
    if (!ds) return;
    const newOff = clampOffset(
      dragRef.current.startOx + (clientX - dragRef.current.startMouseX),
      dragRef.current.startOy + (clientY - dragRef.current.startMouseY),
      ds.cW, ds.cH, ds.w, ds.h
    );
    offsetRef.current = newOff;
    setOffset(newOff);
    emitFocalPoint(newOff, ds);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  const ds = natural ? getDisplaySize(zoom) : null;

  return (
    <div className='space-y-2.5'>
      <div
        ref={containerRef}
        className='relative aspect-[3/1] w-full overflow-hidden rounded-xl select-none'
        style={{
          cursor: isDragging ? 'grabbing' : (natural ? 'grab' : 'default'),
          touchAction: 'none',
          background: '#0a0a0a',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          loop
          draggable={false}
          className='absolute max-w-none pointer-events-none'
          style={ds
            ? { width: ds.w, height: ds.h, left: offset.x, top: offset.y }
            : { width: '100%', height: '100%', objectFit: 'cover' }
          }
        />

        {/* Regla de tercios */}
        {natural && (
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '33.33% 33.33%',
            }}
          />
        )}

        {natural && !isDragging && (
          <div className='absolute bottom-2 inset-x-0 flex justify-center pointer-events-none'>
            <span className='text-[10px] font-semibold text-white/75 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full tracking-wide'>
              Arrastrá para reencuadrar
            </span>
          </div>
        )}
      </div>

      {natural && (
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => onZoomChange(Math.max(1, +(zoom - 0.1).toFixed(2)))}
            className='w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-default bg-surface-secondary hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors text-base font-bold leading-none'
          >−</button>
          <input
            type='range'
            min={1} max={3} step={0.02}
            value={zoom}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className='flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-accent'
          />
          <button
            type='button'
            onClick={() => onZoomChange(Math.min(3, +(zoom + 0.1).toFixed(2)))}
            className='w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-default bg-surface-secondary hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors text-base font-bold leading-none'
          >+</button>
          <span className='text-[11px] text-muted font-mono w-8 text-right shrink-0'>{zoom.toFixed(1)}×</span>
        </div>
      )}
    </div>
  );
}

export default function NovedadVideoTrimDialog({ isOpen, videoSrc, initial, onCancel, onConfirm }) {
  const videoRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [zoom, setZoom] = useState(initial?.zoom ?? 1);
  const [focalPoint, setFocalPoint] = useState(initial?.focalPoint ?? { x: 50, y: 50 });
  const seededTrimRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      seededTrimRef.current = false;
      setNatural(null);
      setZoom(initial?.zoom ?? 1);
      setFocalPoint(initial?.focalPoint ?? { x: 50, y: 50 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, videoSrc]);

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    setNatural({ w: v.videoWidth, h: v.videoHeight });
    const d = v.duration || 0;
    setDuration(d);
    if (!seededTrimRef.current) {
      seededTrimRef.current = true;
      const s = initial?.trimStart ?? 0;
      const e = initial?.trimEnd && initial.trimEnd > 0 ? initial.trimEnd : d;
      setStart(s);
      setEnd(e);
      v.currentTime = s;
    }
  }

  function handleStartChange(value) {
    const next = Math.min(value, end - 0.1);
    setStart(next < 0 ? 0 : next);
    if (videoRef.current) videoRef.current.currentTime = next;
  }

  function handleEndChange(value) {
    const next = Math.max(value, start + 0.1);
    setEnd(next > duration ? duration : next);
    if (videoRef.current) videoRef.current.currentTime = next;
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime < start || v.currentTime >= end) {
      v.currentTime = start;
      if (v.paused) v.play().catch(() => {});
    }
  }

  function handleConfirm() {
    onConfirm({ trimStart: start, trimEnd: end, zoom, focalPoint });
  }

  return (
    <Dialog isOpen={isOpen} onClose={onCancel} title='Recortar video' size='lg'>
      <div className='p-5 space-y-4'>
        <p className='text-[13px] text-muted'>
          Arrastrá y hacé zoom para elegir el encuadre, igual que con las imágenes. Elegí también el tramo de duración que se va a reproducir.
        </p>

        {videoSrc && (
          <VideoFrameEditor
            videoRef={(el) => {
              videoRef.current = el;
              if (el && el.src !== videoSrc) {
                el.src = videoSrc;
                el.onloadedmetadata = handleLoadedMetadata;
                el.ontimeupdate = handleTimeUpdate;
              }
            }}
            natural={natural}
            focalPoint={focalPoint}
            zoom={zoom}
            onZoomChange={setZoom}
            onFocalPointChange={setFocalPoint}
          />
        )}

        <div className='space-y-3 border-t border-default pt-3'>
          <div className='flex items-center gap-3'>
            <span className='w-16 shrink-0 text-xs text-muted'>Inicio</span>
            <input
              type='range'
              min={0}
              max={duration || 0}
              step={0.1}
              value={start}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              aria-label='Inicio del recorte'
              className='flex-1 accent-accent'
            />
            <span className='w-10 shrink-0 text-right text-xs tabular-nums text-muted'>{formatTime(start)}</span>
          </div>
          <div className='flex items-center gap-3'>
            <span className='w-16 shrink-0 text-xs text-muted'>Fin</span>
            <input
              type='range'
              min={0}
              max={duration || 0}
              step={0.1}
              value={end}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              aria-label='Fin del recorte'
              className='flex-1 accent-accent'
            />
            <span className='w-10 shrink-0 text-right text-xs tabular-nums text-muted'>{formatTime(end)}</span>
          </div>
          <p className='text-xs text-muted'>Duración del recorte: {formatTime(Math.max(0, end - start))}</p>
        </div>

        <div className='flex gap-3 pt-1'>
          <Button type='button' variant='tertiary' className='flex-1' onClick={onCancel}>Cancelar</Button>
          <Button type='button' className='flex-1' onClick={handleConfirm} isDisabled={!duration}>
            <LuCrop className='h-3.5 w-3.5' /> Confirmar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
