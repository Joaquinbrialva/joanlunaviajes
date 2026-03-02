import { NextResponse } from 'next/server';
import {
  createOfferId,
  createUniqueSlug,
  readOffers,
  slugify,
  writeOffers,
} from '@/lib/mock-store';

export const dynamic = 'force-dynamic';

function splitLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const offers = await readOffers();

    const title = String(body.title || '').trim();
    const destinationCountry = String(body.destinationCountry || '').trim();

    if (!title || !destinationCountry) {
      return NextResponse.json(
        { error: 'Completá título y país de destino.' },
        { status: 400 }
      );
    }

    const existingSlugs = new Set(offers.map((item) => item.slug));
    const generatedSlug = createUniqueSlug(
      body.slug || `${title} ${body.destinationCity || ''} ${destinationCountry}`,
      existingSlugs
    );
    const now = new Date().toISOString();
    const nextId = createOfferId(offers);
    const coverSeed = slugify(`${generatedSlug}-${Date.now()}`);

    const price = Number(body.price || 0);
    const originalPrice = Number(body.originalPrice || 0);
    const hasDiscount = originalPrice > price && price > 0;
    const discountPercentage = hasDiscount
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

    const newOffer = {
      id: nextId,
      slug: generatedSlug,
      title,
      subtitle: String(body.summary || '').trim() || `Experiencia destacada en ${body.destinationCity || destinationCountry}.`,
      location: {
        city: String(body.destinationCity || '').trim() || destinationCountry,
        country: destinationCountry,
        airport: String(body.destinationAirport || '').trim() || 'N/A',
      },
      category: 'Internacional',
      tags: ['Experiencia', 'Turismo', 'Premium'],
      rating: {
        value: 4.7,
        reviewsCount: 0,
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
              discountPercentage,
              finalPrice: price,
            }
          : { price }),
        pricePer: 'persona',
        installments: {
          available: false,
        },
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
          id: `img-${nextId}-1`,
          url: String(body.coverImage || `https://picsum.photos/seed/${coverSeed}/1200/800`),
          alt: `Vista de ${destinationCountry}`,
          isCover: true,
          order: 0,
        },
      ],
      highlights: splitLines(body.highlights || 'Atención personalizada\nAsistencia local\nExperiencia curada'),
      cancellationPolicy: {
        refundable: false,
      },
      isFeatured: Boolean(body.featured),
      isPopular: false,
      createdAt: now,
      updatedAt: now,
    };

    const next = [newOffer, ...offers];
    await writeOffers(next);

    return NextResponse.json(newOffer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar la oferta.' },
      { status: 500 }
    );
  }
}
