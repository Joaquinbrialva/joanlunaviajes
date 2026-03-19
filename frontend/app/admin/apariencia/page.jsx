'use client';

import { useState, useEffect, useRef } from 'react';
import { Spinner, ProgressCircle } from '@heroui/react';
import {
  LuUpload, LuImage, LuVideo, LuCheck,
  LuInfo, LuChevronDown, LuSave, LuRotateCcw, LuCrop, LuX,
} from 'react-icons/lu';
import { toastSuccess, toastError } from '@/lib/toast';

export default function AparienciaPage() {
  const [saved, setSaved] = useState(null);
  const [type, setType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 });

  // pendingCrop: { src: string, file: File|null }
  // file=null means re-cropping an existing uploaded image (no re-upload needed)
  const [pendingCrop, setPendingCrop] = useState(null);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadMediaProgress, setUploadMediaProgress] = useState(0);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadPosterProgress, setUploadPosterProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const mediaInputRef = useRef(null);
  const posterInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/settings/hero').then(r => r.ok ? r.json() : null),
    ]).then(([auth, hero]) => {
      if (auth?.user) setRole(auth.user.role);
      if (hero?.url) {
        const fp = hero.focalPoint ?? { x: 50, y: 50 };
        const s = { type: hero.type || 'image', url: hero.url, poster: hero.poster || '', focalPoint: fp };
        setSaved(s);
        setType(s.type);
        setMediaUrl(s.url);
        setPosterUrl(s.poster);
        setFocalPoint(fp);
      }
      setLoaded(true);
    });
  }, []);

  const hasChanges = !!saved && (
    type !== saved.type ||
    mediaUrl !== saved.url ||
    posterUrl !== saved.poster ||
    focalPoint.x !== (saved.focalPoint?.x ?? 50) ||
    focalPoint.y !== (saved.focalPoint?.y ?? 50)
  );
  const canSave = hasChanges && !!mediaUrl && !uploadingMedia && !uploadingPoster && !saving && !pendingCrop;

  function uploadFile(file, setUploading, setUrl, setProgress = () => {}) {
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toastError(
        `El archivo pesa ${sizeMB} MB. El límite es ${MAX_MB} MB.\nUsá un video más corto o comprímelo antes de subir.`,
        'Archivo demasiado grande'
      );
      return Promise.resolve();
    }
    setProgress(0);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'hero');
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/media');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            setUrl(data.url);
          } else {
            toastError(data?.error || 'Error al subir.', 'Error al subir');
          }
        } catch {
          toastError('Error al subir.', 'Error al subir');
        }
        setUploading(false);
        resolve();
      };
      xhr.onerror = () => { toastError('Error de red.', 'Error al subir'); setUploading(false); resolve(); };
      xhr.send(fd);
    });
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/hero', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url: mediaUrl, poster: posterUrl || null, focalPoint }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved({ type, url: mediaUrl, poster: posterUrl, focalPoint });
      toastSuccess('Cambios guardados.');
    } catch (err) {
      toastError(err, 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (!saved) return;
    setPendingCrop(null);
    setType(saved.type);
    setMediaUrl(saved.url);
    setPosterUrl(saved.poster);
    setFocalPoint(saved.focalPoint ?? { x: 50, y: 50 });
  }

  // Called when crop editor confirms a focal point
  async function handleCropConfirm(fp) {
    setFocalPoint(fp);
    if (pendingCrop?.file) {
      // New file — upload it now
      await uploadFile(pendingCrop.file, setUploadingMedia, setMediaUrl, setUploadMediaProgress);
    }
    // Revoke local object URL if it was one
    if (pendingCrop?.src?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCrop.src);
    }
    setPendingCrop(null);
  }

  function handleCropCancel() {
    if (pendingCrop?.src?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingCrop.src);
    }
    setPendingCrop(null);
  }

  function openCropForExisting() {
    setPendingCrop({ src: mediaUrl, file: null });
  }

  if (loaded && role && !['admin', 'designer'].includes(role)) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apariencia del Hero</h1>
          <p className="text-sm text-muted mt-0.5">
            Imagen o video de portada de la página de inicio.
          </p>
        </div>

        {hasChanges && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-2.5 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Cambios sin guardar
          </span>
        )}
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ── Preview ── */}
        <div className="rounded-2xl border border-default bg-surface overflow-hidden">
          <div className="px-5 py-3.5 border-b border-default flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Vista previa</p>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {type === 'image' ? <LuImage className="w-3.5 h-3.5" /> : <LuVideo className="w-3.5 h-3.5" />}
              {type === 'image' ? 'Imagen' : 'Video'}
            </div>
          </div>

          {/* Viewport simulado */}
          <div className="relative aspect-video bg-black">
            {uploadingMedia ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                <ProgressCircle value={uploadMediaProgress} minValue={0} maxValue={100} size="md" color="default">
                  <ProgressCircle.Track>
                    <ProgressCircle.TrackCircle />
                    <ProgressCircle.FillCircle />
                  </ProgressCircle.Track>
                </ProgressCircle>
                <span className="text-[11px] font-semibold text-white/70">{uploadMediaProgress}%</span>
              </div>
            ) : mediaUrl && type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
              />
            ) : mediaUrl && type === 'video' ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                poster={posterUrl || undefined}
                muted loop autoPlay playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-white/30">Sin media seleccionada</p>
              </div>
            )}

            {/* Overlay realista del Hero */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

              {/* Navbar flotante miniatura */}
              <div className="absolute top-2 left-2 right-2 h-5 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center px-2.5 gap-2">
                <span className="text-white text-[7px] font-extrabold tracking-tight leading-none">
                  JOANLUNA<em className="text-orange-400 not-italic font-light ml-px">viajes</em>
                </span>
                <div className="flex-1 flex justify-center gap-3">
                  {['Destinos', 'Ofertas', 'Nosotros'].map(l => (
                    <span key={l} className="text-white/50 text-[5px] font-medium">{l}</span>
                  ))}
                </div>
                <span className="text-[5px] font-semibold text-white bg-orange-500 rounded-full px-1.5 py-0.5">Consultar</span>
              </div>

              {/* Texto del hero miniatura */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="h-px w-4 bg-orange-400" />
                  <div className="h-1.5 w-16 bg-white/30 rounded" />
                </div>
                <div className="h-3.5 w-28 bg-white/70 rounded mb-1" />
                <div className="h-4 w-20 bg-orange-400/80 rounded mb-2.5" />
                <div className="h-2 w-32 bg-white/40 rounded mb-3" />
                <div className="flex gap-1.5">
                  <div className="h-4 w-14 bg-orange-500 rounded-full" />
                  <div className="h-4 w-12 bg-white/15 rounded-full border border-white/25" />
                </div>
              </div>

              {/* Stats bar miniatura */}
              <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/25 border-t border-white/10 flex items-center gap-5 px-4">
                {['500+ destinos', '15 años', '98% satisfacción'].map(s => (
                  <span key={s} className="text-white/60 text-[6px] font-medium whitespace-nowrap">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <p className="px-5 py-2.5 text-[11px] text-muted bg-surface-secondary border-t border-default flex items-center gap-1.5">
            <LuInfo className="w-3 h-3 text-accent shrink-0" />
            Vista aproximada — el resultado final puede variar levemente.
          </p>
        </div>

        {/* ── Panel de controles ── */}
        <div className="flex flex-col gap-3.5">

          {/* Tipo */}
          <div className={`rounded-2xl border bg-surface p-4 space-y-3 transition-colors duration-300 ${hasChanges ? 'border-accent/25' : 'border-default'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Tipo de media</p>
            <div className="relative flex h-9 rounded-xl bg-surface-secondary p-1">
              <div
                className="absolute top-1 h-7 rounded-lg bg-surface shadow-sm border border-default transition-all duration-200 ease-out"
                style={{ left: type === 'image' ? '4px' : 'calc(50%)', width: 'calc(50% - 4px)' }}
              />
              {[
                { value: 'image', label: 'Imagen', Icon: LuImage },
                { value: 'video', label: 'Video', Icon: LuVideo },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => { setPendingCrop(null); setType(value); }}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium z-10 rounded-lg transition-colors ${
                    type === value ? 'text-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload / Crop editor */}
          <div className={`rounded-2xl border bg-surface p-4 space-y-3 transition-colors duration-300 ${hasChanges ? 'border-accent/25' : 'border-default'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {type === 'image' ? 'Imagen del hero' : 'Video del hero'}
            </p>

            {/* Crop editor (imagen pendiente de confirmar) */}
            {pendingCrop ? (
              <CropEditor
                src={pendingCrop.src}
                initialFocalPoint={focalPoint}
                onConfirm={handleCropConfirm}
                onCancel={handleCropCancel}
                uploading={uploadingMedia}
                uploadProgress={uploadMediaProgress}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-full group rounded-xl border-2 border-dashed border-default hover:border-accent/40 hover:bg-accent/[0.025] transition-all duration-150 p-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingMedia ? (
                    <div className="flex flex-col items-center gap-2">
                      <ProgressCircle value={uploadMediaProgress} minValue={0} maxValue={100} size="sm" color="accent">
                        <ProgressCircle.Track>
                          <ProgressCircle.TrackCircle />
                          <ProgressCircle.FillCircle />
                        </ProgressCircle.Track>
                      </ProgressCircle>
                      <p className="text-xs text-muted">Subiendo… {uploadMediaProgress}%</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-surface-secondary group-hover:bg-accent/10 flex items-center justify-center transition-colors duration-150">
                        <LuUpload className="w-4 h-4 text-muted group-hover:text-accent transition-colors duration-150" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium">
                          {type === 'image' ? 'Subir imagen' : 'Subir video'}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {type === 'image' ? 'JPG, PNG, WebP — máx. 8 MB' : 'MP4, WebM — máx. 10 MB'}
                        </p>
                      </div>
                    </div>
                  )}
                </button>

                {/* Botón editar recorte — visible cuando hay imagen ya subida */}
                {type === 'image' && mediaUrl && (
                  <button
                    type="button"
                    onClick={openCropForExisting}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-default bg-surface-secondary hover:bg-surface-tertiary text-[13px] font-medium text-muted hover:text-foreground transition-colors"
                  >
                    <LuCrop className="w-3.5 h-3.5" />
                    Editar recorte
                  </button>
                )}

                {mediaUrl && mediaUrl !== saved?.url && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                    <LuCheck className="w-3.5 h-3.5 shrink-0" />
                    Nuevo archivo listo — guardá para aplicar
                  </div>
                )}
              </>
            )}

            <input
              ref={mediaInputRef}
              type="file"
              accept={type === 'image' ? 'image/*' : 'video/*'}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (type === 'image') {
                  // Show crop editor before uploading
                  const localUrl = URL.createObjectURL(f);
                  setPendingCrop({ src: localUrl, file: f });
                } else {
                  // Video: upload directly (no crop)
                  uploadFile(f, setUploadingMedia, setMediaUrl, setUploadMediaProgress);
                }
                e.target.value = '';
              }}
            />
          </div>

          {/* Poster (solo video) */}
          {type === 'video' && (
            <div className={`rounded-2xl border bg-surface p-4 space-y-3 transition-colors duration-300 ${hasChanges ? 'border-accent/25' : 'border-default'}`}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Portada del video</p>
                <p className="text-xs text-muted mt-1">Se muestra mientras el video carga.</p>
              </div>

              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                disabled={uploadingPoster}
                className="w-full group rounded-xl border-2 border-dashed border-default hover:border-accent/40 hover:bg-accent/[0.025] transition-all duration-150 p-4 disabled:opacity-50"
              >
                {uploadingPoster ? (
                  <div className="flex items-center justify-center gap-2">
                    <ProgressCircle value={uploadPosterProgress} minValue={0} maxValue={100} size="sm" color="accent">
                      <ProgressCircle.Track>
                        <ProgressCircle.TrackCircle />
                        <ProgressCircle.FillCircle />
                      </ProgressCircle.Track>
                    </ProgressCircle>
                    <span className="text-xs text-muted">Subiendo… {uploadPosterProgress}%</span>
                  </div>
                ) : posterUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-default">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Portada cargada</p>
                      <p className="text-xs text-muted">Clic para cambiar</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <LuImage className="w-4 h-4" />
                    <span className="text-[13px] font-medium">Subir imagen de portada</span>
                  </div>
                )}
              </button>

              <input
                ref={posterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f, setUploadingPoster, setPosterUrl, setUploadPosterProgress);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {/* Tips colapsable */}
          <div className="rounded-2xl border border-default bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setTipsOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <LuInfo className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">Rendimiento</span>
              </div>
              <LuChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${tipsOpen ? 'rotate-180' : ''}`} />
            </button>
            {tipsOpen && (
              <div className="px-4 pb-4 border-t border-default pt-3 space-y-1.5">
                {type === 'image' ? (
                  <>
                    <Tip>Usá <strong>WebP</strong> o <strong>AVIF</strong> — 30–50% más liviano que JPG</Tip>
                    <Tip>Resolución: <strong>1920×1080 px</strong></Tip>
                    <Tip>Peso objetivo: <strong>300–500 KB</strong></Tip>
                  </>
                ) : (
                  <>
                    <Tip>Formato: <strong>WebM (VP9)</strong> o <strong>MP4 (H.264)</strong></Tip>
                    <Tip>Duración ideal: <strong>15–30 seg</strong> en loop</Tip>
                    <Tip>Peso objetivo: <strong>5–15 MB</strong></Tip>
                    <Tip>Siempre cargá una imagen de portada</Tip>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="rounded-2xl border border-default bg-surface p-3 space-y-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                canSave
                  ? 'bg-accent text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 cursor-pointer'
                  : 'bg-surface-secondary text-muted cursor-not-allowed'
              }`}
            >
              {saving
                ? <><Spinner color="current" size="sm" /> Guardando...</>
                : <><LuSave className="w-3.5 h-3.5" /> Guardar cambios</>
              }
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="w-full h-8 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-secondary transition-colors flex items-center justify-center gap-1.5"
              >
                <LuRotateCcw className="w-3 h-3" />
                Descartar cambios
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <p className="flex gap-2 text-xs text-muted">
      <span className="text-accent shrink-0 mt-px">→</span>
      <span>{children}</span>
    </p>
  );
}

// ─── Crop Editor ──────────────────────────────────────────────────────────────
// Drag-to-crop estilo Instagram. El usuario arrastra y hace zoom sobre la imagen
// dentro del frame del hero para elegir qué parte se ve.

function CropEditor({ src, initialFocalPoint, onConfirm, onCancel, uploading, uploadProgress = 0 }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);   // { startMouseX, startMouseY, startOx, startOy }
  const offsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState(null); // { w, h }
  const [isDragging, setIsDragging] = useState(false);

  // Tamaño de la imagen mostrada = cover-scale × zoom
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

  // Inicializar offset desde focal point una vez conocidas las dimensiones naturales
  useEffect(() => {
    if (!natural || !containerRef.current) return;
    const ds = getDisplaySize(1);
    if (!ds) return;
    const fp = initialFocalPoint ?? { x: 50, y: 50 };
    const ox = -((fp.x / 100) * (ds.w - ds.cW));
    const oy = -((fp.y / 100) * (ds.h - ds.cH));
    const clamped = clampOffset(ox, oy, ds.cW, ds.cH, ds.w, ds.h);
    setOffset(clamped);
    offsetRef.current = clamped;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural]);

  // Re-clampear el offset al cambiar el zoom (para que la imagen siempre cubra)
  useEffect(() => {
    if (!natural) return;
    const ds = getDisplaySize(zoom);
    if (!ds) return;
    const clamped = clampOffset(offsetRef.current.x, offsetRef.current.y, ds.cW, ds.cH, ds.w, ds.h);
    offsetRef.current = clamped;
    setOffset(clamped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural]);

  function applyZoom(newZoom) {
    const z = Math.max(1, Math.min(3, parseFloat(newZoom.toFixed(2))));
    zoomRef.current = z;
    setZoom(z);
  }

  function handleImgLoad() {
    if (imgRef.current) {
      setNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
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
    const ds = getDisplaySize(zoomRef.current);
    if (!ds) return;
    const newOff = clampOffset(
      dragRef.current.startOx + (clientX - dragRef.current.startMouseX),
      dragRef.current.startOy + (clientY - dragRef.current.startMouseY),
      ds.cW, ds.cH, ds.w, ds.h
    );
    offsetRef.current = newOff;
    setOffset(newOff);
  }

  function handlePointerUp() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function handleConfirm() {
    const ds = getDisplaySize(zoomRef.current);
    if (!ds) { onConfirm({ x: 50, y: 50 }); return; }
    const { x: ox, y: oy } = offsetRef.current;
    const fpX = ds.w - ds.cW > 0 ? Math.round((-ox / (ds.w - ds.cW)) * 100) : 50;
    const fpY = ds.h - ds.cH > 0 ? Math.round((-oy / (ds.h - ds.cH)) * 100) : 50;
    onConfirm({ x: fpX, y: fpY });
  }

  const ds = natural ? getDisplaySize(zoom) : null;

  return (
    <div className="space-y-2.5">
      {/* Frame de recorte */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden select-none"
        style={{
          aspectRatio: '16/9',
          cursor: isDragging ? 'grabbing' : (natural ? 'grab' : 'default'),
          touchAction: 'none',
          background: '#0a0a0a',
          boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent) 50%, transparent)',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt="Recorte"
          onLoad={handleImgLoad}
          draggable={false}
          className="absolute max-w-none pointer-events-none"
          style={ds
            ? { width: ds.w, height: ds.h, left: offset.x, top: offset.y }
            : { width: '100%', height: '100%', objectFit: 'cover' }
          }
        />

        {/* Regla de tercios */}
        {natural && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '33.33% 33.33%',
            }}
          />
        )}

        {/* Cargando imagen */}
        {!natural && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <ProgressCircle isIndeterminate size="sm" color="default">
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
          </div>
        )}

        {/* Hint — desaparece al arrastrar */}
        {natural && !isDragging && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
            <span className="text-[10px] font-semibold text-white/75 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full tracking-wide">
              Arrastra para reencuadrar
            </span>
          </div>
        )}
      </div>

      {/* Zoom */}
      {natural && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.1)}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-default bg-surface-secondary hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors text-base font-bold leading-none"
          >−</button>
          <input
            type="range"
            min={1} max={3} step={0.02}
            value={zoom}
            onChange={(e) => applyZoom(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-accent"
            style={{ background: `linear-gradient(to right, var(--accent) ${((zoom - 1) / 2) * 100}%, var(--surface-secondary) 0%)` }}
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.1)}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-default bg-surface-secondary hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors text-base font-bold leading-none"
          >+</button>
          <span className="text-[11px] text-muted font-mono w-8 text-right shrink-0">{zoom.toFixed(1)}×</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={uploading || !natural}
          className="flex-1 h-10 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <ProgressCircle value={uploadProgress} minValue={0} maxValue={100} size="sm" color="default">
                <ProgressCircle.Track>
                  <ProgressCircle.TrackCircle />
                  <ProgressCircle.FillCircle />
                </ProgressCircle.Track>
              </ProgressCircle>
              Subiendo… {uploadProgress}%
            </>
          ) : (
            <><LuCrop className="w-3.5 h-3.5" /> Confirmar recorte</>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-default bg-surface-secondary hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors disabled:opacity-60"
          aria-label="Cancelar"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
