import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import sharp from 'sharp';
import { requireRole } from '../middleware/auth.js';
import { supabase } from '../store/supabase.js';

const BUCKET = 'images';
const MAX_IMAGE_DIMENSION = 1920;
const ALLOWED_ROLES = ['admin', 'agent', 'designer'];

// `folder` viene del cliente y termina siendo parte de la key en Storage: se
// limita a un nombre simple para que no pueda escaparse a otra ruta del bucket.
function sanitizeFolder(value, fallback = '') {
  const cleaned = String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, ''))
    .filter((part) => part && part !== '.' && part !== '..')
    .slice(0, 2)
    .join('/');
  return cleaned || fallback;
}

async function optimizeImage(buffer) {
  const optimized = await sharp(buffer)
    .rotate() // aplica orientación EXIF antes de despojarla
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return { buffer: optimized, contentType: 'image/webp', ext: '.webp' };
}

// El bucket se crea una sola vez por instancia: sin este cache, cada upload
// pagaba un listBuckets() de ida y vuelta contra Supabase.
let bucketReady = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets?.find((b) => b.name === BUCKET)) return;
      await supabase.storage.createBucket(BUCKET, { public: true });
    })().catch((err) => {
      bucketReady = null; // que un fallo transitorio no deje el cache envenenado
      throw err;
    });
  }
  return bucketReady;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB (se comprime server-side a WebP)
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Solo se permiten imágenes.'));
  },
});

const router = Router();

// POST /api/upload  (admin/agent/designer — sólo el panel sube imágenes)
router.post('/', ...requireRole(...ALLOWED_ROLES), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  try {
    await ensureBucket();
    const { buffer, contentType, ext } = await optimizeImage(req.file.buffer);
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const folder = sanitizeFolder(req.body.folder || req.query.folder);
    const filename = folder ? `${folder}/${baseName}` : baseName;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    res.status(500).json({ error: 'No se pudo subir la imagen.' });
  }
});

// POST /api/upload/media — para hero: acepta imágenes Y videos (admin/designer)
const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes o videos.'));
  },
});

router.post('/media', ...requireRole(...ALLOWED_ROLES), uploadMedia.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  try {
    await ensureBucket();
    const isImage = req.file.mimetype.startsWith('image/');
    let buffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let ext = path.extname(req.file.originalname).toLowerCase() ||
      (isImage ? '.jpg' : '.mp4');

    if (isImage) {
      const optimized = await optimizeImage(req.file.buffer);
      buffer = optimized.buffer;
      contentType = optimized.contentType;
      ext = optimized.ext;
    }

    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const folder = sanitizeFolder(req.body.folder || req.query.folder, 'hero');
    const filename = `${folder}/${baseName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error('[POST /api/upload/media]', err);
    res.status(500).json({ error: 'No se pudo subir el archivo.' });
  }
});

export default router;
