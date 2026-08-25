import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { slugify, uniqueSlug } from '../store/slugify.js';
import { optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Solo el staff ve borradores; el público ve únicamente lo publicado.
const STAFF_ROLES = ['admin', 'agent', 'designer'];
const isStaff = (req) => STAFF_ROLES.includes(req.user?.role);

const VALID_STATUS = ['draft', 'published'];

function splitLines(value) {
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

function splitComma(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function normalizeCommaList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return splitComma(value);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return splitLines(value);
}

// GET /api/destinos
router.get('/', optionalAuth, async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      where: isStaff(req) ? undefined : { status: 'published' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(destinations);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener los destinos.' });
  }
});

// GET /api/destinos/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const destination = await prisma.destination.findUnique({ where: { slug: req.params.slug } });
    if (!destination) return res.status(404).json({ error: 'Destino no encontrado.' });
    // Un borrador no existe para el público: 404, no 403, para no delatar el slug.
    if (destination.status !== 'published' && !isStaff(req)) {
      return res.status(404).json({ error: 'Destino no encontrado.' });
    }
    res.json(destination);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener el destino.' });
  }
});

// POST /api/destinos  (admin y agent únicamente)
router.post('/', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    const body = req.body;
    const city = String(body.city || '').trim();
    const country = String(body.country || '').trim();
    const title = String(body.title || '').trim() || `Descubrí ${city}`;

    if (!city || !country) {
      return res.status(400).json({ error: 'Completá ciudad y país del destino.' });
    }

    const existingSlugRows = await prisma.destination.findMany({ select: { slug: true } });
    const existingSlugs = new Set(existingSlugRows.map((d) => d.slug));
    const slug = uniqueSlug(body.slug || `${city}-${country}`, existingSlugs);
    const coverSeed = slugify(`${slug}-${Date.now()}`);
    const isRecommended = Boolean(body.isRecommended);
    const coverImageUrl = String(body.featuredImage || '').trim();

    const data = {
      slug,
      title,
      city,
      country,
      continent: String(body.continent || 'América'),
      description:
        String(body.description || '').trim() ||
        `${city} es uno de los destinos más destacados de ${country}, reconocido por su riqueza cultural y experiencias inolvidables.`,
      shortDescription:
        String(body.shortDescription || '').trim() ||
        `Descubrí lo mejor de ${city} en tu próximo viaje.`,
      travelInfo: {
        airport: String(body.airport || '').trim() || 'N/A',
        currency: String(body.currency || 'USD'),
        language: String(body.language || '').trim() || 'Español',
        timezone: String(body.timezone || '').trim() || 'America/Argentina/Buenos_Aires',
        visaRequired: Boolean(body.visaRequired),
        recommendedStayDays: Math.max(1, Number(body.recommendedStayDays || 5)),
      },
      climate: {
        type: String(body.climateType || '').trim() || 'Templado',
        averageTemperatureC: Number(body.averageTemperatureC || 20),
        bestMonthsToVisit: normalizeCommaList(body.bestMonthsToVisit),
      },
      highlights: normalizeList(body.highlights),
      travelStyles: normalizeList(body.travelStyles),
      featuredImage: coverImageUrl || `https://picsum.photos/seed/${coverSeed}/1200/800`,
      gallery: normalizeList(body.gallery),
      stats: {
        annualVisitorsMillions: Number(body.annualVisitorsMillions || 0),
        safetyIndex: Math.min(100, Math.max(0, Number(body.safetyIndex || 50))),
        averageDailyBudgetUSD: Math.max(1, Number(body.averageDailyBudgetUSD || 100)),
      },
      seo: {
        metaTitle: String(body.metaTitle || '').trim() || `Viajes a ${city} | Guía y Ofertas`,
        metaDescription:
          String(body.metaDescription || '').trim() ||
          `Información completa sobre ${city}, consejos de viaje y las mejores ofertas disponibles.`,
      },
      isPopular: Boolean(body.isPopular),
      isFeatured: Boolean(body.isFeatured),
      isRecommended,
      status: VALID_STATUS.includes(body.status) ? body.status : 'draft',
    };

    let newDestination;
    await prisma.$transaction(async (tx) => {
      if (isRecommended) {
        await tx.destination.updateMany({ data: { isRecommended: false } });
      }
      newDestination = await tx.destination.create({ data });
    });

    res.status(201).json(newDestination);
  } catch (err) {
    console.error('[POST /api/destinos]', err);
    res.status(500).json({ error: 'No se pudo guardar el destino.' });
  }
});

// PATCH /api/destinos/:id  (admin y agent)
router.patch('/:id', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    const existing = await prisma.destination.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Destino no encontrado.' });

    const body = req.body;
    const isRecommended = Boolean(body.isRecommended);
    const newFeaturedImage = String(body.featuredImage || existing.featuredImage).trim();

    const updateData = {
      title: String(body.title || existing.title).trim(),
      city: String(body.city || existing.city).trim(),
      country: String(body.country || existing.country).trim(),
      continent: String(body.continent || existing.continent),
      description: String(body.description || existing.description).trim(),
      shortDescription: String(body.shortDescription || existing.shortDescription).trim(),
      travelInfo: {
        airport: String(body.airport || existing.travelInfo.airport).trim(),
        currency: String(body.currency || existing.travelInfo.currency),
        language: String(body.language || existing.travelInfo.language).trim(),
        timezone: String(body.timezone || existing.travelInfo.timezone).trim(),
        visaRequired: Boolean(body.visaRequired),
        recommendedStayDays: Math.max(1, Number(body.recommendedStayDays || existing.travelInfo.recommendedStayDays)),
      },
      climate: {
        type: String(body.climateType || existing.climate.type).trim(),
        averageTemperatureC: Number(body.averageTemperatureC ?? existing.climate.averageTemperatureC),
        bestMonthsToVisit: normalizeCommaList(body.bestMonthsToVisit).length > 0
          ? normalizeCommaList(body.bestMonthsToVisit)
          : existing.climate.bestMonthsToVisit,
      },
      highlights: normalizeList(body.highlights).length > 0 ? normalizeList(body.highlights) : existing.highlights,
      travelStyles: normalizeList(body.travelStyles).length > 0 ? normalizeList(body.travelStyles) : existing.travelStyles,
      featuredImage: newFeaturedImage,
      gallery: normalizeList(body.gallery).length > 0 ? normalizeList(body.gallery) : existing.gallery,
      stats: {
        annualVisitorsMillions: Number(body.annualVisitorsMillions ?? existing.stats.annualVisitorsMillions),
        safetyIndex: Math.min(100, Math.max(0, Number(body.safetyIndex ?? existing.stats.safetyIndex))),
        averageDailyBudgetUSD: Math.max(1, Number(body.averageDailyBudgetUSD ?? existing.stats.averageDailyBudgetUSD)),
      },
      seo: {
        metaTitle: String(body.metaTitle || existing.seo.metaTitle).trim(),
        metaDescription: String(body.metaDescription || existing.seo.metaDescription).trim(),
      },
      isPopular: Boolean(body.isPopular),
      isFeatured: Boolean(body.isFeatured),
      isRecommended,
      status: VALID_STATUS.includes(body.status) ? body.status : (existing.status || 'draft'),
    };

    let updated;
    await prisma.$transaction(async (tx) => {
      if (isRecommended) {
        await tx.destination.updateMany({ where: { id: { not: req.params.id } }, data: { isRecommended: false } });
      }
      updated = await tx.destination.update({ where: { id: req.params.id }, data: updateData });
    });

    res.json(updated);
  } catch (err) {
    console.error('[PATCH /api/destinos]', err);
    res.status(500).json({ error: 'No se pudo actualizar el destino.' });
  }
});

// DELETE /api/destinos/:id  (admin y agent únicamente)
router.delete('/:id', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    await prisma.destination.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Destino no encontrado.' });
    res.status(500).json({ error: 'No se pudo eliminar el destino.' });
  }
});

export default router;
