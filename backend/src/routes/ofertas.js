import { Router } from 'express';
import { db, nextOfferId, uniqueSlug, slugify } from '../store/db.js';

const router = Router();

function splitLines(value) {
  return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

// GET /api/ofertas
router.get('/', async (req, res) => {
  try {
    const offers = await db.offers.read();
    res.json(offers);
  } catch {
    res.status(500).json({ error: 'No se pudieron obtener las ofertas.' });
  }
});

// GET /api/ofertas/:slug
router.get('/:slug', async (req, res) => {
  try {
    const offers = await db.offers.read();
    const offer = offers.find((o) => o.slug === req.params.slug);
    if (!offer) return res.status(404).json({ error: 'Oferta no encontrada.' });
    res.json(offer);
  } catch {
    res.status(500).json({ error: 'No se pudo obtener la oferta.' });
  }
});

// POST /api/ofertas
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const offers = await db.offers.read();

    const title = String(body.title || '').trim();
    const destinationCountry = String(body.destinationCountry || '').trim();

    if (!title || !destinationCountry) {
      return res.status(400).json({ error: 'Completá título y país de destino.' });
    }

    const existingSlugs = new Set(offers.map((o) => o.slug));
    const slug = uniqueSlug(
      body.slug || `${title} ${body.destinationCity || ''} ${destinationCountry}`,
      existingSlugs
    );
    const now = new Date().toISOString();
    const id = nextOfferId(offers);
    const coverSeed = slugify(`${slug}-${Date.now()}`);

    const price = Number(body.price || 0);
    const originalPrice = Number(body.originalPrice || 0);
    const hasDiscount = originalPrice > price && price > 0;

    const newOffer = {
      id,
      slug,
      title,
      subtitle: String(body.summary || '').trim() || `Experiencia destacada en ${body.destinationCity || destinationCountry}.`,
      location: {
        city: String(body.destinationCity || '').trim() || destinationCountry,
        country: destinationCountry,
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
        startDate: String(body.startDate || now),
        endDate: String(body.endDate || now),
        limitedSpots: Number(body.seats || 0) <= 5,
        remainingSpots: Math.max(1, Number(body.seats || 1)),
      },
      hotel: {
        name: String(body.hotelName || `${destinationCountry} Grand Hotel`),
        stars: Math.min(5, Math.max(3, Number(body.hotelStars || 4))),
        roomType: 'Standard',
        amenities: ['WiFi', 'Desayuno incluido', 'Traslados'],
      },
      includes: splitLines(body.includes),
      notIncludes: splitLines(body.notIncludes),
      images: [
        {
          id: `img-${id}-1`,
          url: String(body.coverImage || `https://picsum.photos/seed/${coverSeed}/1200/800`),
          alt: `Vista de ${destinationCountry}`,
          isCover: true,
          order: 0,
        },
      ],
      highlights: splitLines(body.highlights || 'Atención personalizada\nAsistencia local\nExperiencia curada'),
      cancellationPolicy: { refundable: false },
      isFeatured: Boolean(body.featured),
      isPopular: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.offers.write([newOffer, ...offers]);
    res.status(201).json(newOffer);
  } catch {
    res.status(500).json({ error: 'No se pudo guardar la oferta.' });
  }
});

// DELETE /api/ofertas/:id
router.delete('/:id', async (req, res) => {
  try {
    const offers = await db.offers.read();
    const filtered = offers.filter((o) => o.id !== req.params.id);
    if (filtered.length === offers.length) {
      return res.status(404).json({ error: 'Oferta no encontrada.' });
    }
    await db.offers.write(filtered);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'No se pudo eliminar la oferta.' });
  }
});

export default router;
