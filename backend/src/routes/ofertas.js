import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { slugify, uniqueSlug } from '../store/slugify.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createNotification } from '../store/notifications.js';

const router = Router();

function splitLines(value) {
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return splitLines(value);
}

// GET /api/ofertas
router.get('/', async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(offers);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las ofertas.' });
  }
});

// GET /api/ofertas/:slug
router.get('/:slug', async (req, res) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { slug: req.params.slug } });
    if (!offer) return res.status(404).json({ error: 'Oferta no encontrada.' });
    res.json(offer);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener la oferta.' });
  }
});

// POST /api/ofertas  (admin y agent únicamente)
router.post('/', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    const body = req.body;

    const title = String(body.title || '').trim();
    const isMulti = String(body.tripType || '') === 'multi';
    const destinationCountry = String(body.destinationCountry || '').trim();

    if (!title || (!isMulti && !destinationCountry)) {
      return res.status(400).json({ error: 'Completá título y país de destino.' });
    }

    const existingSlugRows = await prisma.offer.findMany({ select: { slug: true } });
    const existingSlugs = new Set(existingSlugRows.map((o) => o.slug));
    const slug = uniqueSlug(
      body.slug || `${title} ${body.destinationCity || ''} ${destinationCountry}`,
      existingSlugs
    );

    const coverSeed = slugify(`${slug}-${Date.now()}`);
    const coverImageUrl = String(body.coverImage || '').trim();
    const imgBase = `img-${Date.now()}`;

    const price = Number(body.price || 0);
    const originalPrice = Number(body.originalPrice || 0);
    const hasDiscount = originalPrice > price && price > 0;
    const isSpecialOffer = Boolean(body.isSpecialOffer);

    const data = {
      slug,
      title,
      mediaReady: Boolean(coverImageUrl),
      isSpecialOffer,
      subtitle: String(body.summary || '').trim() || `Experiencia destacada en ${body.destinationCity || destinationCountry}.`,
      location: {
        city: isMulti
          ? String(body.customRoute || '').split('→')[0]?.trim() || 'Multi-destino'
          : String(body.destinationCity || '').trim() || destinationCountry,
        country: isMulti ? 'Multi-destino' : destinationCountry,
        airport: String(body.destinationAirport || '').trim() || 'N/A',
      },
      category: 'Internacional',
      tags: ['Experiencia', 'Turismo', 'Premium'],
      rating: { value: 4.7, reviewsCount: 0 },
      duration: {
        nights: Math.max(1, Number(body.nights || 1)),
        days: Math.max(1, Number(body.days || 1)),
      },
      pricing: {
        currency: String(body.currency || 'USD'),
        ...(hasDiscount
          ? {
              originalPrice,
              discountPercentage: Math.round(((originalPrice - price) / originalPrice) * 100),
              finalPrice: price,
            }
          : { price }),
        pricePer: 'persona',
        installments: { available: false },
      },
      availability: {
        startDate: String(body.startDate || new Date().toISOString()),
        endDate: String(body.endDate || new Date().toISOString()),
        limitedSpots: Number(body.seats || 0) <= 5,
        remainingSpots: Math.max(1, Number(body.seats || 1)),
      },
      hotel: {
        name: String(body.hotelName || `${destinationCountry} Grand Hotel`),
        stars: Math.min(5, Math.max(3, Number(body.hotelStars || 4))),
        roomType: 'Standard',
        amenities: ['WiFi', 'Desayuno incluido', 'Traslados'],
      },
      includes: normalizeList(body.includes),
      notIncludes: normalizeList(body.notIncludes),
      images: [
        {
          id: `${imgBase}-1`,
          url: coverImageUrl || `https://picsum.photos/seed/${coverSeed}/1200/800`,
          alt: `Vista de ${destinationCountry}`,
          isCover: true,
          order: 0,
        },
        ...normalizeList(body.galleryImages).map((url, i) => ({
          id: `${imgBase}-${i + 2}`,
          url: String(url),
          alt: `Vista de ${destinationCountry}`,
          isCover: false,
          order: i + 1,
        })),
      ],
      highlights: normalizeList(body.highlights).length > 0
        ? normalizeList(body.highlights)
        : ['Atención personalizada', 'Asistencia local', 'Experiencia curada'],
      cancellationPolicy: { refundable: false },
      origin: {
        city: String(body.originCity || '').trim(),
        country: String(body.originCountry || 'Argentina').trim(),
      },
      airline: {
        name: String(body.airline || '').trim(),
        iata: String(body.airlineIata || '').trim(),
      },
      flight: { type: String(body.flightType || 'direct') },
      luggage: {
        personal: body.luggagePersonal !== false,
        carryOn: body.luggageCarryOn !== false,
        checked: Boolean(body.luggageChecked),
      },
      status: ['draft', 'published'].includes(body.status) ? body.status : 'draft',
      isFeatured: Boolean(body.featured),
      isPopular: false,
    };

    let newOffer;
    await prisma.$transaction(async (tx) => {
      if (isSpecialOffer) {
        await tx.offer.updateMany({ data: { isSpecialOffer: false } });
      }
      newOffer = await tx.offer.create({ data });
    });

    if (!coverImageUrl) {
      createNotification({
        type: 'pending_media',
        title: 'Nueva oferta pendiente de imagen',
        body: `La oferta "${newOffer.title}" fue creada y está esperando su imagen de portada.`,
        forRoles: ['designer'],
        offerId: newOffer.id,
        offerSlug: newOffer.slug,
        offerTitle: newOffer.title,
      }).catch(() => {});
    }

    res.status(201).json(newOffer);
  } catch (err) {
    console.error('[POST /api/ofertas]', err);
    res.status(500).json({ error: 'No se pudo guardar la oferta.' });
  }
});

// PATCH /api/ofertas/:id  (todos los roles autenticados)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Oferta no encontrada.' });

    const body = req.body;
    const title = String(body.title || '').trim();
    const isMulti = String(body.tripType || '') === 'multi';
    const destinationCountry = String(body.destinationCountry || '').trim();

    if (!title || (!isMulti && !destinationCountry)) {
      return res.status(400).json({ error: 'Completá título y país de destino.' });
    }

    const price = Number(body.price || 0);
    const originalPrice = Number(body.originalPrice || 0);
    const hasDiscount = originalPrice > price && price > 0;
    const isSpecialOffer = Boolean(body.isSpecialOffer);

    const isDesignerMediaUpload =
      req.user?.role === 'designer' &&
      Boolean(body.coverImage) &&
      existing.mediaReady === false;

    const hasCoverChange = Boolean(body.coverImage);
    const hasGalleryChange = Array.isArray(body.galleryImages);

    let images = existing.images;
    let mediaReady = existing.mediaReady ?? false;

    if (hasCoverChange || hasGalleryChange) {
      const coverUrl = body.coverImage || existing.images?.[0]?.url || '';
      const galleryUrls = hasGalleryChange
        ? body.galleryImages.map(String).filter(Boolean)
        : (existing.images?.filter((i) => !i.isCover).map((i) => i.url) || []);

      images = [
        {
          id: existing.images?.[0]?.id || `img-${existing.id}-1`,
          url: String(coverUrl),
          alt: `Vista de ${destinationCountry || existing.location.country}`,
          isCover: true,
          order: 0,
        },
        ...galleryUrls.map((url, i) => ({
          id: existing.images?.[i + 1]?.id || `img-${existing.id}-${i + 2}`,
          url: String(url),
          alt: `Vista de ${destinationCountry || existing.location.country}`,
          isCover: false,
          order: i + 1,
        })),
      ];

      if (hasCoverChange) mediaReady = true;
    }

    const updateData = {
      title,
      isSpecialOffer,
      subtitle: String(body.summary || '').trim() || existing.subtitle,
      location: {
        city: isMulti
          ? String(body.customRoute || '').split('→')[0]?.trim() || 'Multi-destino'
          : String(body.destinationCity || '').trim() || destinationCountry,
        country: isMulti ? 'Multi-destino' : destinationCountry,
        airport: String(body.destinationAirport || '').trim() || 'N/A',
      },
      duration: {
        nights: Math.max(1, Number(body.nights || 1)),
        days: Math.max(1, Number(body.days || 1)),
      },
      pricing: {
        currency: String(body.currency || 'USD'),
        ...(hasDiscount
          ? {
              originalPrice,
              discountPercentage: Math.round(((originalPrice - price) / originalPrice) * 100),
              finalPrice: price,
            }
          : { price }),
        pricePer: 'persona',
        installments: { available: false },
      },
      availability: {
        startDate: String(body.startDate || existing.availability?.startDate),
        endDate: String(body.endDate || existing.availability?.endDate),
        limitedSpots: Number(body.seats || 0) <= 5,
        remainingSpots: Math.max(1, Number(body.seats || 1)),
      },
      hotel: {
        name: String(body.hotelName || existing.hotel?.name || ''),
        stars: Math.min(5, Math.max(3, Number(body.hotelStars || existing.hotel?.stars || 4))),
        roomType: existing.hotel?.roomType || 'Standard',
        amenities: existing.hotel?.amenities || ['WiFi', 'Desayuno incluido', 'Traslados'],
      },
      includes: normalizeList(body.includes).length > 0 ? normalizeList(body.includes) : existing.includes,
      notIncludes: normalizeList(body.notIncludes).length > 0 ? normalizeList(body.notIncludes) : existing.notIncludes,
      highlights: normalizeList(body.highlights).length > 0 ? normalizeList(body.highlights) : existing.highlights,
      origin: {
        city: String(body.originCity || '').trim(),
        country: String(body.originCountry || 'Argentina').trim(),
      },
      airline: {
        name: String(body.airline || '').trim(),
        iata: String(body.airlineIata || '').trim(),
      },
      flight: { type: String(body.flightType || 'direct') },
      luggage: {
        personal: body.luggagePersonal !== false,
        carryOn: body.luggageCarryOn !== false,
        checked: Boolean(body.luggageChecked),
      },
      status: isDesignerMediaUpload
        ? 'published'
        : (['draft', 'published'].includes(body.status) ? body.status : (existing.status || 'draft')),
      isFeatured: Boolean(body.featured),
      mediaReady,
      images,
    };

    let updated;
    await prisma.$transaction(async (tx) => {
      if (isSpecialOffer) {
        await tx.offer.updateMany({ where: { id: { not: req.params.id } }, data: { isSpecialOffer: false } });
      }
      updated = await tx.offer.update({ where: { id: req.params.id }, data: updateData });
    });

    if (isDesignerMediaUpload) {
      createNotification({
        type: 'media_uploaded',
        title: 'Imagen subida por el diseñador',
        body: `El diseñador subió la imagen para "${updateData.title}". La oferta fue publicada automáticamente.`,
        forRoles: ['admin', 'agent'],
        offerId: existing.id,
        offerSlug: existing.slug,
        offerTitle: updateData.title,
      }).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/ofertas]', err);
    res.status(500).json({ error: 'No se pudo actualizar la oferta.' });
  }
});

// DELETE /api/ofertas/:id  (admin y agent únicamente)
router.delete('/:id', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    await prisma.offer.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Oferta no encontrada.' });
    res.status(500).json({ error: 'No se pudo eliminar la oferta.' });
  }
});

export default router;
