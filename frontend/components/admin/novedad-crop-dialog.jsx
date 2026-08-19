'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@heroui/react';
import Dialog from '@/components/admin/kit/dialog';

const TARGET_ASPECT = 1920 / 640; // 3:1 — mismo formato que el banner principal

async function getCroppedBlob(imageSrc, cropPixels) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, canvas.width, canvas.height
  );

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

export { TARGET_ASPECT, getCroppedBlob };

export default function NovedadCropDialog({ isOpen, imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedPixels);
      onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onCancel} title='Ajustar imagen' size='lg'>
      <div className='p-5 space-y-4'>
        <p className='text-[13px] text-muted'>
          Esta imagen no tiene el formato recomendado (1920×640px, ratio 3:1). Ajustá el encuadre antes de subirla.
        </p>

        <div className='relative h-72 w-full overflow-hidden rounded-xl bg-surface-secondary'>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={TARGET_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-xs text-muted shrink-0'>Zoom</span>
          <input
            type='range'
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label='Zoom'
            className='flex-1 accent-accent'
          />
        </div>

        <div className='flex gap-3 pt-1'>
          <Button type='button' variant='tertiary' className='flex-1' onClick={onCancel}>Cancelar</Button>
          <Button type='button' className='flex-1' onClick={handleConfirm} isDisabled={saving}>
            {saving ? 'Procesando...' : 'Aplicar recorte'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
