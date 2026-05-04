import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../store/supabase.js';

const BUCKET = 'images';

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.find((b) => b.name === BUCKET)) return;
  await supabase.storage.createBucket(BUCKET, { public: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Solo se permiten imágenes.'));
  },
});

const router = Router();

// POST /api/upload  (requires auth)
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  try {
    await ensureBucket();
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const folder = String(req.body.folder || req.query.folder || '').trim().replace(/^\/|\/$/g, '');
    const filename = folder ? `${folder}/${baseName}` : baseName;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
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

router.post('/media', requireAuth, uploadMedia.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  if (!['admin', 'agent'].includes(req.user.role)) {
    return res.status(403).json({ error: 'No autorizado.' });
  }

  try {
    await ensureBucket();
    const ext = path.extname(req.file.originalname).toLowerCase() ||
      (req.file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const folder = String(req.body.folder || req.query.folder || 'hero').trim().replace(/^\/|\/$/g, '');
    const filename = `${folder}/${baseName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
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
