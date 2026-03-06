import { Router } from 'express';
import { db, nextDestinationId, uniqueSlug, slugify } from '../store/db.js';

const router = Router();

function splitLines(value) {
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

function splitComma(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

// GET /api/destinos
router.get('/', async (req, res) => {
  try {
    const destinations = await db.destinations.read();
    res.json(destinations);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener los destinos.' });
  }
});

// GET /api/destinos/:slug
router.get('/:slug', async (req, res) => {
  try {
    const destinations = await db.destinations.read();
    const destination = destinations.find((d) => d.slug === req.params.slug);
    if (!destination) return res.status(404).json({ error: 'Destino no encontrado.' });
    res.json(destination);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener el destino.' });
  }
});

// POST /api/destinos
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const destinations = await db.destinations.read();

    const name = String(body.name || '').trim();
    const country = String(body.country || '').trim();

    if (!name || !country) {
      return res.status(400).json({ error: 'Completá nombre y país del destino.' });
    }

    const existingSlugs = new Set(destinations.map((d) => d.slug));
    const slug = uniqueSlug(body.slug || `${name}-${country}`, existingSlugs);
    const id = nextDestinationId(destinations);
    const now = new Date().toISOString();
    const coverSeed = slugify(`${slug}-${Date.now()}`);

    const newDestination = {
      id,
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
      gallery: splitLines(body.gallery),
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
      status: String(body.status || 'draft'),
      createdAt: now,
      updatedAt: now,
    };

    await db.destinations.write([newDestination, ...destinations]);
    res.status(201).json(newDestination);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar el destino.' });
  }
});

// DELETE /api/destinos/:id
router.delete('/:id', async (req, res) => {
  try {
    const destinations = await db.destinations.read();
    const filtered = destinations.filter((d) => d.id !== req.params.id);
    if (filtered.length === destinations.length) {
      return res.status(404).json({ error: 'Destino no encontrado.' });
    }
    await db.destinations.write(filtered);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar el destino.' });
  }
});

export default router;
