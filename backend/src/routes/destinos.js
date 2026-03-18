import { Router } from 'express';
import { prisma } from '../store/prisma.js';
import { slugify, uniqueSlug } from '../store/slugify.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function splitLines(value) {
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

function splitComma(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return splitLines(value);
}

// GET /api/destinos
router.get('/', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(destinations);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener los destinos.' });
  }
});

// GET /api/destinos/:slug
router.get('/:slug', async (req, res) => {
  try {
    const destination = await prisma.destination.findUnique({ where: { slug: req.params.slug } });
    if (!destination) return res.status(404).json({ error: 'Destino no encontrado.' });
    res.json(destination);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener el destino.' });
  }
});

// POST /api/destinos  (admin y agent únicamente)
router.post('/', ...requireRole('admin', 'agent'), async (req, res) => {
  try {
    const body = req.body;
    const name = String(body.name || '').trim();
    const country = String(body.country || '').trim();

    if (!name || !country) {
      return res.status(400).json({ error: 'Completá nombre y país del destino.' });
    }

    const existingSlugRows = await prisma.destination.findMany({ select: { slug: true } });
    const existingSlugs = new Set(existingSlugRows.map((d) => d.slug));
    const slug = uniqueSlug(body.slug || `${name}-${country}`, existingSlugs);
    const coverSeed = slugify(`${slug}-${Date.now()}`);
    const isRecommended = Boolean(body.isRecommended);

    const data = {
      slug,
      name,
      country,
      continent: String(body.continent || 'América'),
      description:
        String(body.description || '').trim() ||
        `${name} es uno de los destinos más destacados de ${country}, reconocido por su riqueza cultural y experiencias inolvidables.`,
      shortDescription:
        String(body.shortDescription || '').trim() ||
        `Descubrí lo mejor de ${name} en tu próximo viaje.`,
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
        bestMonthsToVisit: splitComma(body.bestMonthsToVisit),
      },
      highlights: splitLines(body.highlights),
      travelStyles: splitLines(body.travelStyles),
      featuredImage:
        String(body.featuredImage || '').trim() ||
        `https://picsum.photos/seed/${coverSeed}/1200/800`,
      gallery: normalizeList(body.gallery),
      stats: {
        annualVisitorsMillions: Number(body.annualVisitorsMillions || 0),
        safetyIndex: Math.min(100, Math.max(0, Number(body.safetyIndex || 50))),
        averageDailyBudgetUSD: Math.max(1, Number(body.averageDailyBudgetUSD || 100)),
      },
      seo: {
        metaTitle: String(body.metaTitle || '').trim() || `Viajes a ${name} | Guía y Ofertas`,
        metaDescription:
          String(body.metaDescription || '').trim() ||
          `Información completa sobre ${name}, consejos de viaje y las mejores ofertas disponibles.`,
      },
      isPopular: Boolean(body.isPopular),
      isFeatured: Boolean(body.isFeatured),
      isRecommended,
      status: String(body.status || 'draft'),
    };

    let newDestination;
    await prisma.$transaction(async (tx) => {
      if (isRecommended) {
        await tx.destination.updateMany({ data: { isRecommended: false } });
      }
      newDestination = await tx.destination.create({ data });
    });

    res.status(201).json(newDestination);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar el destino.' });
  }
});

// PATCH /api/destinos/:id  (todos los roles autenticados)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.destination.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Destino no encontrado.' });

    const body = req.body;
    const isRecommended = Boolean(body.isRecommended);

    const updateData = {
      name: String(body.name || existing.name).trim(),
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
        bestMonthsToVisit: splitComma(body.bestMonthsToVisit).length > 0
          ? splitComma(body.bestMonthsToVisit)
          : existing.climate.bestMonthsToVisit,
      },
      highlights: splitLines(body.highlights).length > 0 ? splitLines(body.highlights) : existing.highlights,
      travelStyles: splitLines(body.travelStyles).length > 0 ? splitLines(body.travelStyles) : existing.travelStyles,
      featuredImage: String(body.featuredImage || existing.featuredImage).trim(),
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
      status: String(body.status || existing.status),
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
