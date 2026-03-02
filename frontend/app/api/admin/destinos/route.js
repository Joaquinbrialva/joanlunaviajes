import { NextResponse } from 'next/server';
import {
  createDestinationId,
  createUniqueSlug,
  readDestinations,
  slugify,
  writeDestinations,
} from '@/lib/mock-store';

export const dynamic = 'force-dynamic';

function splitLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComma(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const destinations = await readDestinations();

    const name = String(body.name || '').trim();
    const country = String(body.country || '').trim();

    if (!name || !country) {
      return NextResponse.json(
        { error: 'Completá nombre y país del destino.' },
        { status: 400 }
      );
    }

    const existingSlugs = new Set(destinations.map((item) => item.slug));
    const generatedSlug = createUniqueSlug(
      body.slug || `${name}-${country}`,
      existingSlugs
    );
    const nextId = createDestinationId(destinations);
    const now = new Date().toISOString();
    const coverSeed = slugify(`${generatedSlug}-${Date.now()}`);

    const newDestination = {
      id: nextId,
      slug: generatedSlug,
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
        metaTitle:
          String(body.metaTitle || '').trim() || `Viajes a ${name} | Guía y Ofertas`,
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

    const next = [newDestination, ...destinations];
    await writeDestinations(next);

    return NextResponse.json(newDestination, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar el destino.' },
      { status: 500 }
    );
  }
}
