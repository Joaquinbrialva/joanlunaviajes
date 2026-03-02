import { NextResponse } from 'next/server';
import { readOffers } from '@/lib/mock-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const offers = await readOffers();
    return NextResponse.json(offers, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron obtener las ofertas.' },
      { status: 500 }
    );
  }
}
