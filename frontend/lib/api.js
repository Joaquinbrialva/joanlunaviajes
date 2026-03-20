const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

export async function fetchOffers() {
  const res = await fetch(`${BACKEND}/api/ofertas`, { cache: 'no-store' });
  return res.json();
}

export async function fetchOffer(slug) {
  const res = await fetch(`${BACKEND}/api/ofertas/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchDestinations() {
  const res = await fetch(`${BACKEND}/api/destinos`, { cache: 'no-store' });
  return res.json();
}

export async function fetchDestination(slug) {
  const res = await fetch(`${BACKEND}/api/destinos/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}
