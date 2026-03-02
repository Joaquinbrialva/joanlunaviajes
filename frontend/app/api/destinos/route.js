import { NextResponse } from 'next/server';
import { readDestinations } from '@/lib/mock-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const destinations = await readDestinations();
    return NextResponse.json(destinations, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron obtener los destinos.' },
      { status: 500 }
    );
  }
}
